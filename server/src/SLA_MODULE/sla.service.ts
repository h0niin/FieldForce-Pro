import { Injectable, Inject, Logger } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { SlaPolicy } from './sla_policies.entity';
import { ServiceRequestSla } from './service_request_slas.entity';
import { SlaAuditLog } from './sla_audit_logs.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { SlaPauseTrigger } from './sla_pause_triggers.entity';
import { Op } from 'sequelize';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @Inject(KEYNAMES.SLA_POLICIES)
    private readonly slaPolicyRepository: typeof SlaPolicy,
    @Inject(KEYNAMES.SERVICE_REQUEST_SLAS)
    private readonly serviceRequestSlaRepository: typeof ServiceRequestSla,
    @Inject(KEYNAMES.SLA_AUDIT_LOGS)
    private readonly slaAuditLogRepository: typeof SlaAuditLog,
    @Inject(KEYNAMES.SLA_PAUSE_TRIGGERS)
    private readonly slaPauseTriggerRepository: typeof SlaPauseTrigger,
  ) {}

  async attachSlaToServiceRequest(
    tenantId: string,
    serviceRequest: ServiceRequest,
    transaction?: any,
  ): Promise<ServiceRequestSla | null> {
    try {
      // 1. Sanitize Data: Convert empty strings or undefined to null
      const categoryId = serviceRequest.category_id || null;
      const subCategoryId = serviceRequest.sub_category_id || null;
      const priorityId = serviceRequest.priority_id || null;
      const locationId = serviceRequest.location_id || null; // This might be the SLA location lookup ID

      // 2. Fetch all policies for the tenant (caching this in redis would be ideal in prod)
      const policies = await this.slaPolicyRepository.findAll({
        where: { tenant_id: tenantId, is_active: true, is_deleted: false },
        transaction,
      });

      if (!policies || policies.length === 0) {
        this.logger.warn(`No active SLA policies found for tenant ${tenantId}`);
        return null;
      }

      // 3. Cascading Matcher
      let matchedPolicy = null;

      // Exact Match: category_id + sub_category_id + priority_id + location_id
      matchedPolicy = policies.find(
        (p) =>
          p.category_id === categoryId &&
          p.sub_category_id === subCategoryId &&
          p.priority_id === priorityId &&
          p.location_id === locationId,
      );

      // Fallback 1: category_id + sub_category_id + priority_id (location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === categoryId &&
            p.sub_category_id === subCategoryId &&
            p.priority_id === priorityId &&
            p.location_id === null,
        );
      }

      // Fallback 2: category_id + sub_category_id (priority: null, location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === categoryId &&
            p.sub_category_id === subCategoryId &&
            p.priority_id === null &&
            p.location_id === null,
        );
      }

      // Fallback 3: category_id (sub_category: null, priority: null, location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === categoryId &&
            p.sub_category_id === null &&
            p.priority_id === null &&
            p.location_id === null,
        );
      }

      // Catch-All: priority_id (category: null, sub_category: null, location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === null &&
            p.sub_category_id === null &&
            p.priority_id === priorityId &&
            p.location_id === null,
        );
      }

      if (!matchedPolicy) {
        this.logger.warn(`No matching SLA policy found for SR ${serviceRequest.id}`);
        return null;
      }

      // 4. Calculate deadlines
      const now = new Date();
      const responseDeadline = new Date(now.getTime() + matchedPolicy.response_time_minutes * 60000);
      const resolutionDeadline = new Date(now.getTime() + matchedPolicy.resolution_time_minutes * 60000);

      // 5. Create ServiceRequestSla record
      const slaRecord = await this.serviceRequestSlaRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: serviceRequest.id,
          policy_id: matchedPolicy.id,
          response_deadline: responseDeadline,
          response_status: 'PENDING',
          resolution_deadline: resolutionDeadline,
          resolution_status: 'PENDING',
        },
        { transaction },
      );

      // 6. Create Audit Log
      await this.slaAuditLogRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: serviceRequest.id,
          action: 'SLA_ATTACHED',
          details: {
            policy_id: matchedPolicy.id,
            policy_name: matchedPolicy.name,
            response_deadline: responseDeadline,
            resolution_deadline: resolutionDeadline,
          },
        },
        { transaction },
      );

      return slaRecord;
    } catch (error) {
      this.logger.error(`Error attaching SLA to ServiceRequest ${serviceRequest.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  async handleStatusChange(
    tenantId: string,
    serviceRequest: ServiceRequest,
    oldStatus: string,
    newStatus: string,
    transaction?: any,
  ): Promise<void> {
    const slaRecord = await this.serviceRequestSlaRepository.findOne({
      where: { tenant_id: tenantId, service_request_id: serviceRequest.id, is_deleted: false },
      transaction,
    });

    if (!slaRecord || !slaRecord.policy_id) return;

    const pauseTrigger = await this.slaPauseTriggerRepository.findOne({
      where: {
        sla_policy_id: slaRecord.policy_id,
        status_name: newStatus,
        is_active: true,
      },
      transaction,
    });

    const now = new Date();

    if (pauseTrigger) {
      // Transitioning to a paused state
      const updateData: any = { last_paused_at: now };
      if (slaRecord.response_status === 'PENDING') updateData.response_status = 'PAUSED';
      if (slaRecord.resolution_status === 'PENDING') updateData.resolution_status = 'PAUSED';

      await slaRecord.update(updateData, { transaction });
      await this.slaAuditLogRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: serviceRequest.id,
          action: 'SLA_PAUSED',
          details: { status: newStatus, paused_at: now },
        },
        { transaction },
      );
    } else if (slaRecord.last_paused_at) {
      // Transitioning out of a paused state
      const oldPauseTrigger = await this.slaPauseTriggerRepository.findOne({
        where: {
          sla_policy_id: slaRecord.policy_id,
          status_name: oldStatus,
          is_active: true,
        },
        transaction,
      });

      if (oldPauseTrigger) {
        // We were in a paused state, calculate elapsed time
        const elapsedMs = now.getTime() - slaRecord.last_paused_at.getTime();
        const totalPausedMs = Number(slaRecord.total_paused_ms || 0) + elapsedMs;

        const updateData: any = {
          last_paused_at: null,
          total_paused_ms: totalPausedMs,
        };

        if (slaRecord.response_status === 'PAUSED' && slaRecord.response_deadline) {
          updateData.response_status = 'PENDING';
          updateData.response_deadline = new Date(slaRecord.response_deadline.getTime() + elapsedMs);
        }

        if (slaRecord.resolution_status === 'PAUSED' && slaRecord.resolution_deadline) {
          updateData.resolution_status = 'PENDING';
          updateData.resolution_deadline = new Date(slaRecord.resolution_deadline.getTime() + elapsedMs);
        }

        await slaRecord.update(updateData, { transaction });
        await this.slaAuditLogRepository.create(
          {
            tenant_id: tenantId,
            service_request_id: serviceRequest.id,
            action: 'SLA_RESUMED',
            details: { status: newStatus, resumed_at: now, paused_for_ms: elapsedMs },
          },
          { transaction },
        );
      }
    }
  }

  async attachSlaToWorkOrder(
    tenantId: string,
    workOrder: WorkOrder,
    transaction?: any,
  ): Promise<ServiceRequestSla | null> {
    try {
      const categoryId = workOrder.category || null; // category is string here, might need adjustment if using IDs
      const priorityId = workOrder.priority || null; 
      const locationId = workOrder.location_id || null;

      const policies = await this.slaPolicyRepository.findAll({
        where: { tenant_id: tenantId, is_active: true, is_deleted: false },
        transaction,
      });

      if (!policies || policies.length === 0) return null;

      // Note: In a real system, you'd properly map string categories/priorities to IDs
      // For this implementation we use the catch-all or fallback policies
      let matchedPolicy = policies.find(p => p.name && p.name.startsWith('Default ')) || policies[0];

      const now = new Date();
      const responseDeadline = new Date(now.getTime() + matchedPolicy.response_time_minutes * 60000);
      const resolutionDeadline = new Date(now.getTime() + matchedPolicy.resolution_time_minutes * 60000);

      const slaRecord = await this.serviceRequestSlaRepository.create(
        {
          tenant_id: tenantId,
          work_order_id: workOrder.id,
          policy_id: matchedPolicy.id,
          response_deadline: responseDeadline,
          response_status: 'PENDING',
          resolution_deadline: resolutionDeadline,
          resolution_status: 'PENDING',
        },
        { transaction },
      );

      await this.slaAuditLogRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: null,
          action: 'SLA_ATTACHED',
          details: {
            entity: 'WORK_ORDER',
            entity_id: workOrder.id,
            policy_id: matchedPolicy.id,
            policy_name: matchedPolicy.name,
            response_deadline: responseDeadline,
            resolution_deadline: resolutionDeadline,
          },
        },
        { transaction },
      );

      return slaRecord;
    } catch (error) {
      this.logger.error(`Error attaching SLA to WorkOrder ${workOrder.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  async attachSlaToEstimate(
    tenantId: string,
    estimate: Estimate,
    transaction?: any,
  ): Promise<ServiceRequestSla | null> {
    try {
      const policies = await this.slaPolicyRepository.findAll({
        where: { tenant_id: tenantId, is_active: true, is_deleted: false },
        transaction,
      });

      if (!policies || policies.length === 0) return null;

      let matchedPolicy = policies.find(p => p.name && p.name.startsWith('Default ')) || policies[0];

      const now = new Date();
      const responseDeadline = new Date(now.getTime() + matchedPolicy.response_time_minutes * 60000);
      const resolutionDeadline = new Date(now.getTime() + matchedPolicy.resolution_time_minutes * 60000);

      const slaRecord = await this.serviceRequestSlaRepository.create(
        {
          tenant_id: tenantId,
          estimate_id: estimate.id,
          policy_id: matchedPolicy.id,
          response_deadline: responseDeadline,
          response_status: 'PENDING',
          resolution_deadline: resolutionDeadline,
          resolution_status: 'PENDING',
        },
        { transaction },
      );

      await this.slaAuditLogRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: null,
          action: 'SLA_ATTACHED',
          details: {
            entity: 'ESTIMATE',
            entity_id: estimate.id,
            policy_id: matchedPolicy.id,
            policy_name: matchedPolicy.name,
            response_deadline: responseDeadline,
            resolution_deadline: resolutionDeadline,
          },
        },
        { transaction },
      );

      return slaRecord;
    } catch (error) {
      this.logger.error(`Error attaching SLA to Estimate ${estimate.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  async getAnalytics(tenantId: string) {
    const slas = await this.serviceRequestSlaRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: [
        { model: ServiceRequest, as: 'service_request' },
        { model: WorkOrder, as: 'work_order' },
        { model: Estimate, as: 'estimate' }
      ]
    });

    let totalMet = 0;
    let totalBreached = 0;
    let totalResolutionTimeMs = 0;
    let resolutionCount = 0;
    const breachedList = [];

    for (const sla of slas) {
      let isBreached = false;

      // Check Resolution
      if (sla.resolution_status === 'MET') {
        totalMet++;
        if (sla.resolution_time_ms) {
          totalResolutionTimeMs += Number(sla.resolution_time_ms);
          resolutionCount++;
        }
      } else if (sla.resolution_status === 'BREACHED') {
        totalBreached++;
        isBreached = true;
        if (sla.resolution_time_ms) {
          totalResolutionTimeMs += Number(sla.resolution_time_ms);
          resolutionCount++;
        }
      }

      // Check Response (only increment totalBreached if it wasn't already counted by resolution)
      if (sla.response_status === 'BREACHED') {
        if (!isBreached) {
          totalBreached++;
          isBreached = true;
        }
      } else if (sla.response_status === 'MET' && sla.resolution_status !== 'MET' && sla.resolution_status !== 'BREACHED') {
        // If response is met, but resolution is pending, it shouldn't count towards totalMet yet
        // However, if we wanted to track response stats separately, we could here
      }

      // Add to recent breaches list
      if (isBreached) {
        let entityType = 'Unknown';
        let entityNumber = 'Unknown';
        if (sla.service_request) {
          entityType = 'Service Request';
          entityNumber = sla.service_request.request_number;
        } else if (sla.work_order) {
          entityType = 'Work Order';
          entityNumber = sla.work_order.wo_number;
        } else if (sla.estimate) {
          entityType = 'Estimate';
          entityNumber = sla.estimate.estimate_number;
        }

        const breachType = sla.resolution_status === 'BREACHED' ? 'Resolution' : 'Response';
        const deadline = breachType === 'Resolution' ? sla.resolution_deadline : sla.response_deadline;

        breachedList.push({
          id: sla.id,
          entityType,
          entityNumber,
          breachType,
          deadline,
        });
      }
    }

    const totalResolved = totalMet + totalBreached;
    const compliancePercentage = totalResolved > 0 ? (totalMet / totalResolved) * 100 : 100;
    
    let averageResolutionTime = '0m';
    if (resolutionCount > 0) {
      const avgMs = totalResolutionTimeMs / resolutionCount;
      const hours = Math.floor(avgMs / 3600000);
      const mins = Math.floor((avgMs % 3600000) / 60000);
      averageResolutionTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    // Sort breached list by deadline descending (most recent first)
    breachedList.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

    return {
      compliancePercentage,
      totalBreached,
      totalMet,
      averageResolutionTime,
      recentBreaches: breachedList.slice(0, 50),
    };
  }
}
