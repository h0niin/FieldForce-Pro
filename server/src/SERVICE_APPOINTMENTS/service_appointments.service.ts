import { Injectable, Inject, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ServiceAppointment } from './service_appointments.entity';
import { CreateServiceAppointmentDto } from './dto/service_appointments_create.dto';
import { UpdateServiceAppointmentDto } from './dto/service_appointments_update.dto';
import { UpdateServiceAppointmentStatusDto } from './dto/service_appointments_update_status.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { User } from '../USERS/users.entity';
import { Role } from '../ROLES/roles.entity';
import { NotificationsService } from '../NOTIFICATIONS/notifications.service';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { DocumentApproval } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.entity';
import { DocumentTypeEnum, ApprovalStatusEnum } from '../shared/enums/workflow.enum';
import { Tenant } from '../TENANTS/tenants.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';

// Valid status transitions for service appointments
const STATUS_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['en_route', 'in_progress', 'cancelled'],
  en_route: ['on_site', 'in_progress', 'cancelled'],
  on_site: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

@Injectable()
export class ServiceAppointmentsService implements OnModuleInit {
  private readonly logger = new Logger(ServiceAppointmentsService.name);

  constructor(
    @Inject(KEYNAMES.SERVICE_APPOINTMENTS)
    private readonly serviceAppointmentRepository: typeof ServiceAppointment,
    @Inject(KEYNAMES.WORKFLOW_DOCUMENT_APPROVALS)
    private readonly approvalRepository: typeof DocumentApproval,
    @Inject(KEYNAMES.TENANTS)
    private readonly tenantRepository: typeof Tenant,
    @Inject(KEYNAMES.SUBSCRIPTION_PLANS)
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan,
    private readonly notificationsService: NotificationsService,
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) { }

  /**
   * On server startup, reconcile any stale SCHEDULE approvals that are still
   * PENDING but whose appointment has already moved past 'scheduled'.
   */
  async onModuleInit() {
    try {
      const staleApprovals = await this.approvalRepository.findAll({
        where: {
          document_type: DocumentTypeEnum.SCHEDULE,
          status: ApprovalStatusEnum.PENDING,
          is_deleted: false,
        },
      });

      if (staleApprovals.length === 0) return;

      let resolved = 0;
      for (const approval of staleApprovals) {
        const appointment = await this.serviceAppointmentRepository.findOne({
          where: {
            id: approval.document_id,
            tenant_id: approval.tenant_id,
            is_deleted: false,
          },
          attributes: ['id', 'status'],
        });

        // If appointment no longer exists or is past 'scheduled', resolve the approval
        if (!appointment || appointment.status !== 'scheduled') {
          const currentStatus = appointment?.status || 'deleted';
          const isAccepted = ['en_route', 'on_site', 'in_progress', 'completed'].includes(currentStatus);
          await approval.update({
            status: isAccepted ? ApprovalStatusEnum.APPROVED : ApprovalStatusEnum.SKIPPED,
            comments: `Auto-resolved on startup: appointment status is ${currentStatus}`,
            action_date: new Date(),
          });
          resolved++;
        }
      }

      if (resolved > 0) {
        this.logger.log(`Reconciled ${resolved} stale SCHEDULE approval(s) on startup`);
      }
    } catch (error) {
      this.logger.warn(`Failed to reconcile stale SCHEDULE approvals: ${error.message}`);
    }
  }

  private get standardInclusions() {
    return [
      {
        model: User,
        as: 'agent',
        attributes: ['id', 'first_name', 'last_name', 'email'],
        required: false,
      },
      {
        model: WorkOrder,
        include: [
          { model: Contact },
          { model: ServiceLocation },
        ],
      },
    ];
  }

  private mapToMobile(appointment: ServiceAppointment) {
    if (!appointment) return null;
    const plain = appointment.get({ plain: true }) as any;

    // Flatten customer and location info from joined WorkOrder
    const wo = plain.work_order;
    const contact = wo?.contact;
    const location = wo?.location;

    return {
      ...plain,
      customer_name: contact ? `${contact.first_name} ${contact.last_name}`.trim() : (wo?.summary || 'N/A'),
      customer_phone: contact?.phone || null,
      address: location?.address || 'No address provided',
      latitude: location?.lat != null ? Number(location.lat) : null,
      longitude: location?.lng != null ? Number(location.lng) : null,
      technician_id: plain.agent_id,
    };
  }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
    status?: string,
    excludeStatus?: string,
    hasPendingApproval?: boolean,
    unassigned?: boolean,
  ): Promise<PageDto<any>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    // Only return appointments with no technician assigned
    if (unassigned) {
      where.agent_id = { [Op.is]: null };
    }

    // Filter by status (supports comma-separated list)
    if (status) {
      const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : { [Op.in]: statuses };
    }

    // Exclude specific statuses (supports comma-separated list)
    if (excludeStatus) {
      const excluded = excludeStatus.split(',').map((s) => s.trim()).filter(Boolean);
      where.status = {
        ...(where.status && typeof where.status === 'object' ? where.status as Record<symbol, unknown> : {}),
        [Op.notIn]: excluded,
      };
    }

    // Only return appointments that have a pending SCHEDULE approval record
    if (hasPendingApproval) {
      const { Sequelize } = require('sequelize');
      const pendingIds = (await this.serviceAppointmentRepository.sequelize!.query(
        `SELECT DISTINCT document_id FROM workflow_document_approvals
         WHERE tenant_id = :tenantId
           AND document_type = 'SCHEDULE'
           AND status = 'PENDING'
           AND is_deleted = false`,
        { replacements: { tenantId }, type: Sequelize.QueryTypes.SELECT },
      ) as unknown) as Array<{ document_id: string }>;
      const ids = pendingIds.map((r) => r.document_id);
      if (ids.length === 0) {
        // No pending approvals — return empty result immediately
        const meta = new PageMetaDto({ pageOptionsDto, itemCount: 0 });
        return new PageDto([], meta);
      }
      where.id = { [Op.in]: ids };
    }

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.serviceAppointmentRepository.findAndCountAll({
      where,
      include: this.standardInclusions,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const mappedRows = rows.map(r => this.mapToMobile(r));
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(mappedRows, meta);
  }

  async findAll(tenantId: string): Promise<any[]> {
    const appointments = await this.serviceAppointmentRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: this.standardInclusions,
      order: [['created_at', 'DESC']],
    });
    return appointments.map(a => this.mapToMobile(a));
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const appointment = await this.findModelById(id, tenantId);
    return this.mapToMobile(appointment);
  }

  private async findModelById(id: string, tenantId: string): Promise<ServiceAppointment> {
    const appointment = await this.serviceAppointmentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: this.standardInclusions,
    });
    if (!appointment) {
      throw new NotFoundException('Service appointment not found');
    }
    return appointment;
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<any[]> {
    const appointments = await this.serviceAppointmentRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      include: this.standardInclusions,
      order: [['created_at', 'DESC']],
    });
    return appointments.map(a => this.mapToMobile(a));
  }

  async findByAgent(agentId: string, tenantId: string, date?: string, hasJobSheet?: boolean): Promise<any[]> {
    const where: Record<string, unknown> = {
      agent_id: agentId,
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (date) {
      // Use IST (Asia/Kolkata, UTC+5:30) date range so appointments scheduled for
      // "March 11" in the user's local timezone show on March 11, not March 10.
      // IST midnight = previous day 18:30 UTC.
      const dayStart = new Date(`${date}T00:00:00+05:30`);
      const dayEnd = new Date(`${date}T23:59:59.999+05:30`);
      where.scheduled_start = {
        [Op.gte]: dayStart,
        [Op.lt]: dayEnd,
      };
    }

    if (hasJobSheet) {
      const { Sequelize } = require('sequelize');
      where[Op.or as unknown as string] = [
        {
          id: {
            [Op.in]: Sequelize.literal(
              `(SELECT DISTINCT appointment_id FROM job_sheet_instances WHERE appointment_id IS NOT NULL AND is_deleted = false)`,
            ),
          },
        },
        {
          work_order_id: {
            [Op.in]: Sequelize.literal(
              `(SELECT DISTINCT work_order_id FROM job_sheet_instances WHERE work_order_id IS NOT NULL AND is_deleted = false)`,
            ),
          },
        },
      ];
    }

    const appointments = await this.serviceAppointmentRepository.findAll({
      where,
      include: this.standardInclusions,
      order: [['scheduled_start', 'ASC']],
    });
    return appointments.map(a => this.mapToMobile(a));
  }


  async checkAppointmentLimit(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findByPk(tenantId);
    if (!tenant) throw new NotFoundException('Tenant not found');

    const customMax = (tenant.custom_limits as Record<string, number | null> | null)?.max_appointments_monthly ?? null;
    let limit: number | null = customMax;

    if (limit === null && tenant.subscription_plan_id) {
      const plan = await this.subscriptionPlanRepository.findByPk(tenant.subscription_plan_id);
      limit = plan?.max_appointments_monthly ?? null;
    }

    if (limit === null) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentCount = await this.serviceAppointmentRepository.count({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
        created_at: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    if (currentCount >= limit) {
      throw new BadRequestException(
        `Service appointment limit reached (${currentCount}/${limit} appointments this month). Please upgrade your plan to schedule more appointments.`,
      );
    }
  }


  async create(tenantId: string, dto: CreateServiceAppointmentDto): Promise<any> {
    await this.checkAppointmentLimit(tenantId);

    const appointment = await this.serviceAppointmentRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    const created = await this.findById(appointment.id, tenantId);

    // Notify the assigned technician/agent
    if (dto.agent_id) {
      try {
        const woNumber = created?.work_order?.wo_number || dto.work_order_id;
        const start = dto.scheduled_start
          ? new Date(dto.scheduled_start).toLocaleString()
          : 'TBD';
        const end = dto.scheduled_end
          ? new Date(dto.scheduled_end).toLocaleString()
          : 'TBD';

        await this.notificationsService.create(tenantId, {
          user_id: dto.agent_id,
          type: 'appointment_assigned',
          title: 'You have been assigned to a job',
          body: `You have been assigned to work order ${woNumber}. Scheduled: ${start} → ${end}.`,
          data: {
            entity_type: 'schedule',
            entity_id: appointment.id,
            appointment_id: appointment.id,
            work_order_id: dto.work_order_id,
            navigate_to: 'view_appointment',
          },
          channel: 'in_app',
        });

        // Also notify the technician to open the Field Workflow for this WO
        if (dto.work_order_id) {
          await this.notificationsService.create(tenantId, {
            user_id: dto.agent_id,
            type: 'wo_field_assignment',
            title: `You've been assigned to Work Order ${woNumber}`,
            body: `Tap to open the Field Workflow and begin your job steps.`,
            data: {
              navigate_to: 'field_workflow',
              work_order_id: dto.work_order_id,
              entity_type: 'work_order',
              entity_id: dto.work_order_id,
            },
            channel: 'in_app',
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to notify agent ${dto.agent_id} for appointment ${appointment.id}: ${error.message}`);
      }
    }

    return created;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateServiceAppointmentDto,
  ): Promise<any> {
    const appointment = await this.findModelById(id, tenantId);
    await appointment.update(dto);
    return this.findById(id, tenantId);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    dto: UpdateServiceAppointmentStatusDto,
  ): Promise<any> {
    const appointment = await this.findModelById(id, tenantId);

    const previousStatus = appointment.status;
    const allowedTransitions = STATUS_TRANSITIONS[previousStatus] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from '${previousStatus}' to '${dto.status}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      );
    }

    await appointment.update({ status: dto.status });

    // Resolve any pending SCHEDULE approval whenever the appointment status changes.
    try {
      await this.resolveScheduleApproval(id, tenantId, dto.status);
    } catch (error) {
      this.logger.warn(`Failed to resolve SCHEDULE approval for appointment ${id}: ${error.message}`);
    }

    // Notify admins/managers of key status transitions
    try {
      await this.notifyAdminsOfStatusChange(appointment, previousStatus, dto.status, tenantId);
    } catch (error) {
      this.logger.warn(`Failed to send admin notification for appointment ${id}: ${error.message}`);
    }

    return this.findById(id, tenantId);
  }

  /**
   * Send in-app notifications to admin/manager users when a technician
   * changes appointment status (start trip, arrive, complete, etc.)
   */
  private async notifyAdminsOfStatusChange(
    appointment: ServiceAppointment,
    previousStatus: string,
    newStatus: string,
    tenantId: string,
  ): Promise<void> {
    const NOTIFY_STATUSES: Record<string, { title: string; body: (name: string) => string }> = {
      en_route: {
        title: 'Technician Started Trip',
        body: (name) => `${name} has started the trip and is en route to the job site.`,
      },
      on_site: {
        title: 'Technician Arrived On Site',
        body: (name) => `${name} has arrived at the job site.`,
      },
      in_progress: {
        title: 'Work Started',
        body: (name) => `${name} has started work on the job.`,
      },
      on_hold: {
        title: 'Work Paused',
        body: (name) => `${name} has paused work on the job.`,
      },
      completed: {
        title: 'Job Completed',
        body: (name) => `${name} has completed the job.`,
      },
    };

    const config = NOTIFY_STATUSES[newStatus];
    if (!config) return;

    // Get technician name
    const techUser = appointment.agent_id
      ? await User.findByPk(appointment.agent_id, { attributes: ['first_name', 'last_name'] })
      : null;
    const techName = techUser ? `${techUser.first_name} ${techUser.last_name}`.trim() : 'A technician';

    // Find admin/manager users in the tenant (users with admin-level roles)
    const adminUsers = await User.findAll({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
        is_active: true,
        id: { [Op.ne]: appointment.agent_id || '' },
      },
      include: [{
        model: Role,
        as: 'roles',
        where: {
          name: { [Op.in]: ['admin', 'manager', 'dispatcher', 'owner'] },
          is_deleted: false,
        },
        required: true,
        through: { attributes: [] },
      }],
      attributes: ['id'],
    });

    for (const admin of adminUsers) {
      await this.notificationsService.create(tenantId, {
        user_id: admin.id,
        type: 'appointment_status_change',
        title: config.title,
        body: config.body(techName),
        channel: 'in_app',
        data: {
          entity_type: 'service_appointment',
          entity_id: appointment.id,
          appointment_id: appointment.id,
          work_order_id: appointment.work_order_id,
          previous_status: previousStatus,
          new_status: newStatus,
          navigate_to: 'view_appointment',
        },
      });
    }
  }

  /**
   * Resolve pending SCHEDULE approval records when the appointment status
   * is changed outside the approval workflow (e.g., via direct status update).
   */
  private async resolveScheduleApproval(
    appointmentId: string,
    tenantId: string,
    newStatus: string,
  ): Promise<void> {
    const pendingApprovals = await this.approvalRepository.findAll({
      where: {
        document_id: appointmentId,
        document_type: DocumentTypeEnum.SCHEDULE,
        tenant_id: tenantId,
        status: ApprovalStatusEnum.PENDING,
        is_deleted: false,
      },
    });

    if (pendingApprovals.length === 0) return;

    // Determine approval outcome based on the new appointment status
    const isAccepted = ['en_route', 'on_site', 'in_progress', 'completed'].includes(newStatus);
    const resolvedStatus = isAccepted ? ApprovalStatusEnum.APPROVED : ApprovalStatusEnum.SKIPPED;

    for (const approval of pendingApprovals) {
      await approval.update({
        status: resolvedStatus,
        comments: `Auto-resolved: appointment status changed to ${newStatus}`,
        action_date: new Date(),
      });
    }

    this.logger.log(
      `Resolved ${pendingApprovals.length} SCHEDULE approval(s) for appointment ${appointmentId} → ${resolvedStatus}`,
    );
  }

  async saveSignatureUrl(id: string, tenantId: string, signatureUrl: string): Promise<any> {
    const appointment = await this.findModelById(id, tenantId);
    await appointment.update({ signature_url: signatureUrl });
    return this.findById(id, tenantId);
  }

  async addPhotos(id: string, tenantId: string, photoUrls: string[]): Promise<any> {
    const appointment = await this.findModelById(id, tenantId);
    const existing: string[] = (appointment.photos as string[]) || [];
    await appointment.update({ photos: [...existing, ...photoUrls] });
    return this.findById(id, tenantId);
  }

  async assignTechnician(
    id: string,
    tenantId: string,
    agentId: string,
    adminUserId?: string,
  ): Promise<any> {
    const appointment = await this.findModelById(id, tenantId);

    if (appointment.status !== 'scheduled') {
      throw new BadRequestException(
        `Can only assign technician to appointments in 'scheduled' status. Current status: '${appointment.status}'`,
      );
    }

    // Update agent — status stays as 'scheduled'
    await appointment.update({ agent_id: agentId });
    this.logger.log(`Appointment ${id} assigned to agent ${agentId}, status remains scheduled`);

    const full = await this.findById(id, tenantId);
    const woNumber = full?.work_order?.wo_number || appointment.work_order_id;
    const start = appointment.scheduled_start
      ? new Date(appointment.scheduled_start).toLocaleString()
      : 'TBD';
    const end = appointment.scheduled_end
      ? new Date(appointment.scheduled_end).toLocaleString()
      : 'TBD';

    // Create SCHEDULE approval for the assigned technician.
    // The technician must approve/reject their assignment before the job proceeds.
    try {
      const workflowId = await this.findScheduleWorkflowId(tenantId);

      await this.documentApprovalsService.createDocumentApprovals(tenantId, {
        document_id: id,
        document_type: DocumentTypeEnum.SCHEDULE,
        workflow_id: workflowId,
        approver_ids: [agentId],
      });

      this.logger.log(`Created SCHEDULE approval for appointment ${id}, approver: technician ${agentId}`);

      // Auto-complete the SCHEDULE approval — the admin performing the assignment
      // is the approval action, same pattern as completeEstimateApprovals()
      if (adminUserId) {
        await this.documentApprovalsService.completeScheduleApprovals(id, tenantId, adminUserId);
      }
    } catch (error) {
      this.logger.warn(`Failed to create SCHEDULE approval for appointment ${id}: ${error.message}`);
    }

    // Notify the assigned technician — navigate to the Work Order field workflow
    try {
      await this.notificationsService.create(tenantId, {
        user_id: agentId,
        type: 'appointment_assigned',
        title: 'New Job Assignment',
        body: `You have been assigned to work order ${woNumber}. Scheduled: ${start} → ${end}. Tap to open the field workflow.`,
        data: {
          navigate_to: 'field_workflow',
          work_order_id: appointment.work_order_id,
          entity_type: 'work_order',
          entity_id: appointment.work_order_id,
          appointment_id: id,
        },
        channel: 'in_app',
      });
    } catch (error) {
      this.logger.warn(`Failed to notify agent ${agentId} for appointment ${id}: ${error.message}`);
    }

    return full;
  }

  private async findScheduleWorkflowId(tenantId: string): Promise<string> {
    // Find active SCHEDULE workflow template for this tenant
    // Import is already available via documentApprovalsService, but we need
    // to query directly. We'll use the repository pattern.
    const { Sequelize } = require('sequelize');
    const [result] = await this.serviceAppointmentRepository.sequelize!.query(
      `SELECT id FROM workflow_templates
       WHERE tenant_id = :tenantId
       AND document_type = 'SCHEDULE'
       AND is_active = true
       AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT 1`,
      { replacements: { tenantId }, type: Sequelize.QueryTypes.SELECT },
    );
    if (!result) {
      throw new BadRequestException('No active SCHEDULE workflow template found. Please create one first.');
    }
    return (result as any).id;
  }

  async getScheduleAssignerId(tenantId: string): Promise<string | null> {
    const { Sequelize } = require('sequelize');
    // Find the first approver in the active SCHEDULE workflow — that person is the designated assigner
    const [result] = await this.serviceAppointmentRepository.sequelize!.query(
      `SELECT wa.approver_id
       FROM workflow_templates wt
       JOIN workflow_approvers wa ON wa.workflow_template_id = wt.id
         AND wa.is_deleted = false AND wa.is_active = true
       WHERE wt.tenant_id = :tenantId
         AND wt.document_type = 'SCHEDULE'
         AND wt.is_active = true
         AND wt.is_deleted = false
       ORDER BY wt.created_at DESC, wa.order_no ASC
       LIMIT 1`,
      { replacements: { tenantId }, type: Sequelize.QueryTypes.SELECT },
    );
    return result ? (result as any).approver_id : null;
  }

  async findMyPendingApprovals(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<any>> {
    const documentIds = await this.serviceAppointmentRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'SCHEDULE'
         AND da.status = 'PENDING'
         AND NOT EXISTS (
           SELECT 1 FROM workflow_document_approvals prev
           WHERE prev.document_id = da.document_id
             AND prev.tenant_id = da.tenant_id
             AND prev.order_no < da.order_no
             AND prev.status = 'PENDING'
             AND prev.is_deleted = false
         )`,
      {
        replacements: { tenantId, userId },
        type: 'SELECT' as unknown as undefined,
      },
    ) as unknown as Array<{ document_id: string }>;

    const ids = documentIds.map((r) => r.document_id);

    if (ids.length === 0) {
      const meta = new PageMetaDto({ pageOptionsDto, itemCount: 0 });
      return new PageDto([], meta);
    }

    const where: Record<string, unknown> = {
      id: { [Op.in]: ids },
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.serviceAppointmentRepository.findAndCountAll({
      where,
      include: this.standardInclusions,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const mappedRows = rows.map(r => this.mapToMobile(r));
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(mappedRows, meta);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const appointment = await this.findModelById(id, tenantId);
    await appointment.update({ is_deleted: true });
  }
}
