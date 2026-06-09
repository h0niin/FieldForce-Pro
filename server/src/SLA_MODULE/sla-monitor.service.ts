import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KEYNAMES } from '../shared/constants/keynames';
import { ServiceRequestSla } from './service_request_slas.entity';
import { SlaAuditLog } from './sla_audit_logs.entity';
import { SlaEscalation } from './sla_escalations.entity';
import { NotificationsService } from '../NOTIFICATIONS/notifications.service';
import { Op } from 'sequelize';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { UsersService } from '../USERS/users.service';

@Injectable()
export class SlaMonitorService {
  private readonly logger = new Logger(SlaMonitorService.name);

  constructor(
    @Inject(KEYNAMES.SERVICE_REQUEST_SLAS)
    private readonly slaRepo: typeof ServiceRequestSla,
    @Inject(KEYNAMES.SLA_AUDIT_LOGS)
    private readonly auditLogRepo: typeof SlaAuditLog,
    @Inject(KEYNAMES.SLA_ESCALATIONS)
    private readonly escalationRepo: typeof SlaEscalation,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorSlas() {
    this.logger.debug('Running SLA Monitor Cron...');
    const now = new Date();

    try {
      await this.processBreaches(now);
      await this.processWarnings(now);
    } catch (err) {
      this.logger.error(`Error in SLA Monitor: ${(err as Error).message}`);
    }
  }

  private async processBreaches(now: Date) {
    try {
      // 1. Find all PENDING records where deadlines have passed
      const breachedRecords = await this.slaRepo.findAll({
        where: {
          [Op.or]: [
            {
              response_status: 'PENDING',
              response_deadline: { [Op.lt]: now },
            },
            {
              resolution_status: 'PENDING',
              resolution_deadline: { [Op.lt]: now },
            },
            {
              response_status: 'BREACHED',
              response_escalation_triggered: false,
            },
            {
              resolution_status: 'BREACHED',
              resolution_escalation_triggered: false,
            },
          ],
          is_deleted: false,
        },
        include: [
          { model: ServiceRequest, as: 'service_request' },
          { model: WorkOrder, as: 'work_order' },
          { model: Estimate, as: 'estimate' }
        ],
      });

      if (breachedRecords.length === 0) {
        return;
      }

      this.logger.log(`Found ${breachedRecords.length} breached SLAs. Processing...`);

      for (const record of breachedRecords) {
        // Handle Response Breach
        if (
          (record.response_status === 'PENDING' && record.response_deadline && record.response_deadline < now) ||
          (record.response_status === 'BREACHED' && !record.response_escalation_triggered)
        ) {
          if (record.response_status === 'PENDING') {
            await record.update({ response_status: 'BREACHED' });

            await this.auditLogRepo.create({
              tenant_id: record.tenant_id,
              service_request_id: record.service_request_id || record.work_order_id || record.estimate_id,
              action: 'RESPONSE_BREACHED',
              details: { 
                deadline: record.response_deadline,
                work_order_id: record.work_order_id,
                estimate_id: record.estimate_id,
              },
            });
          }
          
          if (!record.response_escalation_triggered) {
            await this.triggerEscalations(record, 'response');
            await record.update({ response_escalation_triggered: true });
          }
        }

        // Handle Resolution Breach
        if (
          (record.resolution_status === 'PENDING' && record.resolution_deadline && record.resolution_deadline < now) ||
          (record.resolution_status === 'BREACHED' && !record.resolution_escalation_triggered)
        ) {
          if (record.resolution_status === 'PENDING') {
            await record.update({ resolution_status: 'BREACHED' });

            await this.auditLogRepo.create({
              tenant_id: record.tenant_id,
              service_request_id: record.service_request_id || record.work_order_id || record.estimate_id,
              action: 'RESOLUTION_BREACHED',
              details: { 
                deadline: record.resolution_deadline,
                work_order_id: record.work_order_id,
                estimate_id: record.estimate_id,
              },
            });
          }

          if (!record.resolution_escalation_triggered) {
            await this.triggerEscalations(record, 'resolution');
            await record.update({ resolution_escalation_triggered: true });
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error in processBreaches: ${(err as Error).message}`);
    }
  }

  private async processWarnings(now: Date) {
    try {
      // Find all active escalations that have a warning percentage configured
      const warningEscalations = await this.escalationRepo.findAll({
        where: {
          is_active: true,
          warning_percentage: { [Op.ne]: null },
        },
      });

      if (warningEscalations.length === 0) return;

      for (const esc of warningEscalations) {
        const targetType = esc.target_type; // 'response' or 'resolution'
        const statusField = targetType === 'response' ? 'response_status' : 'resolution_status';
        const deadlineField = targetType === 'response' ? 'response_deadline' : 'resolution_deadline';
        const warningSentField = targetType === 'response' ? 'response_warning_sent' : 'resolution_warning_sent';

        // Find all pending SLAs for this policy that haven't sent a warning yet
        const pendingSlas = await this.slaRepo.findAll({
          where: {
            policy_id: esc.sla_policy_id,
            [statusField]: 'PENDING',
            [warningSentField]: false,
            is_deleted: false,
          },
          include: [
            { model: ServiceRequest, as: 'service_request' },
            { model: WorkOrder, as: 'work_order' },
            { model: Estimate, as: 'estimate' }
          ],
        });

        for (const sla of pendingSlas) {
          const deadline = sla[deadlineField] as Date;
          if (!deadline || !sla.created_at) continue;

          const totalSlaTimeMs = deadline.getTime() - sla.created_at.getTime();
          if (totalSlaTimeMs <= 0) continue;

          const elapsedTimeMs = now.getTime() - sla.created_at.getTime();
          const currentPercentage = (elapsedTimeMs / totalSlaTimeMs) * 100;

          if (currentPercentage >= esc.warning_percentage) {
            // Trigger Warning
            let entityType = 'Unknown';
            let entityId = 'Unknown';
            let entityNumber = 'Unknown';
            let navigateTo = 'service_request';

            if (sla.service_request) {
              entityType = 'Service Request';
              entityId = sla.service_request_id;
              entityNumber = sla.service_request.request_number;
              navigateTo = 'service_request';
            } else if (sla.work_order) {
              entityType = 'Work Order';
              entityId = sla.work_order_id;
              entityNumber = sla.work_order.wo_number;
              navigateTo = 'work_order';
            } else if (sla.estimate) {
              entityType = 'Estimate';
              entityId = sla.estimate_id;
              entityNumber = sla.estimate.estimate_number;
              navigateTo = 'estimate';
            }

            this.logger.log(`Triggering SLA Warning [${esc.name}] for ${entityType} ${entityId} at ${currentPercentage.toFixed(1)}%`);

            // Notify Admins
            const admins = await this.usersService.findAdmins(sla.tenant_id);
            for (const admin of admins) {
              await this.notificationsService.create(sla.tenant_id, {
                user_id: admin.id,
                type: 'sla_warning',
                title: 'SLA Warning',
                body: `${entityType} #${entityNumber} is approaching its SLA limit. Technician has not responded.`,
                data: { entity_id: entityId, navigate_to: navigateTo },
                channel: 'in_app',
              });
            }

            await sla.update({ [warningSentField]: true });
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error in processWarnings: ${(err as Error).message}`);
    }
  }

  private async triggerEscalations(slaRecord: ServiceRequestSla, targetType: string) {
    if (!slaRecord.policy_id) return;

    // Find active escalations for this policy and type
    const escalations = await this.escalationRepo.findAll({
      where: {
        sla_policy_id: slaRecord.policy_id,
        target_type: targetType,
        is_active: true,
      },
    });

    for (const esc of escalations) {
      let entityType = 'Unknown';
      let entityId = 'Unknown';
      let entityNumber = 'Unknown';
      let assignedTo = null;
      let targetEntity: any = null;
      let navigateTo = 'service_request';

      if (slaRecord.service_request) {
        entityType = 'Service Request';
        entityId = slaRecord.service_request_id;
        entityNumber = slaRecord.service_request.request_number;
        assignedTo = slaRecord.service_request.assigned_to;
        targetEntity = slaRecord.service_request;
        navigateTo = 'service_request';
      } else if (slaRecord.work_order) {
        entityType = 'Work Order';
        entityId = slaRecord.work_order_id;
        entityNumber = slaRecord.work_order.wo_number;
        assignedTo = slaRecord.work_order.assigned_to;
        targetEntity = slaRecord.work_order;
        navigateTo = 'work_order';
      } else if (slaRecord.estimate) {
        entityType = 'Estimate';
        entityId = slaRecord.estimate_id;
        entityNumber = slaRecord.estimate.estimate_number;
        assignedTo = slaRecord.estimate.created_by; // Estimates don't have assigned_to
        targetEntity = slaRecord.estimate;
        navigateTo = 'estimate';
      }

      this.logger.log(`Triggering escalation [${esc.name}] for ${entityType} ${entityId}`);
      
      const actions = esc.actions || {};
      
      // If the escalation configures a notification to the assignee
      const shouldNotify = actions.action_to_take === 'Notify' || actions.action_to_take === 'Alert' || actions.notify_assignee;

      if (shouldNotify && assignedTo) {
        await this.notificationsService.create(slaRecord.tenant_id, {
          user_id: assignedTo,
          type: 'sla_breach',
          title: `SLA Breached`,
          body: `${entityType} #${entityNumber} has breached its ${targetType} SLA.`,
          data: { entity_id: entityId, navigate_to: navigateTo },
          channel: 'in_app',
        });
      }

      // Re-assign logic could go here based on actions.reassign_to
      if (actions.reassign_to && targetEntity && entityType !== 'Estimate') {
        await targetEntity.update({ assigned_to: actions.reassign_to });
        await this.notificationsService.create(slaRecord.tenant_id, {
          user_id: actions.reassign_to,
          type: `${navigateTo}_assigned`,
          title: 'SLA Escalation Assignment',
          body: `${entityType} ${entityNumber} was escalated to you.`,
          data: { entity_id: entityId, navigate_to: navigateTo },
          channel: 'in_app',
        });
      }
    }
  }
}
