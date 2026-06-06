import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DocumentApproval } from './document_approvals.entity';
import { WorkflowTemplate } from '../WORKFLOW_TEMPLATES/workflow_templates.entity';
import { WorkflowApprover } from '../WORKFLOW_APPROVERS/workflow_approvers.entity';
import { ApprovalHistory } from '../WORKFLOW_APPROVAL_HISTORY/approval_history.entity';
import {
  CreateDocumentApprovalsDto,
  ProcessApprovalDto,
  BulkProcessApprovalDto,
  DelegateApprovalDto,
} from './dto/document_approvals.dto';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';
import { PageDto } from '../../shared/dto/page.dto';
import { PageMetaDto } from '../../shared/dto/page-meta.dto';
import { KEYNAMES } from '../../shared/constants/keynames';
import { ApprovalStatusEnum, ApprovalActionEnum, DocumentTypeEnum } from '../../shared/enums/workflow.enum';
import { Op } from 'sequelize';
import { User } from '../../USERS/users.entity';
import { ServiceRequest } from '../../SERVICE_REQUESTS/service_requests.entity';
import { Estimate } from '../../ESTIMATES/estimates.entity';
import { WorkOrder } from '../../WORK_ORDERS/work_orders.entity';
import { ServiceAppointment } from '../../SERVICE_APPOINTMENTS/service_appointments.entity';
import { JobSheetInstance } from '../../JOB_SHEET_INSTANCES/job_sheet_instances.entity';
import { JobSheetTemplate } from '../../JOB_SHEET_TEMPLATES/job_sheet_templates.entity';
import { Invoice } from '../../INVOICES/invoices.entity';
import { NotificationsService } from '../../NOTIFICATIONS/notifications.service';
import { EmailService } from '../../shared/services/email.service';
import { UsersService } from '../../USERS/users.service';
import { Tenant } from '../../TENANTS/tenants.entity';
import { SubscriptionPlan } from '../../SUBSCRIPTION_PLANS/subscription_plans.entity';

@Injectable()
export class DocumentApprovalsService {
  private readonly logger = new Logger(DocumentApprovalsService.name);

  constructor(
    @Inject(KEYNAMES.WORKFLOW_DOCUMENT_APPROVALS)
    private readonly approvalRepository: typeof DocumentApproval,
    @Inject(KEYNAMES.WORKFLOW_TEMPLATES)
    private readonly templateRepository: typeof WorkflowTemplate,
    @Inject(KEYNAMES.WORKFLOW_APPROVERS)
    private readonly approverRepository: typeof WorkflowApprover,
    @Inject(KEYNAMES.WORKFLOW_APPROVAL_HISTORY)
    private readonly historyRepository: typeof ApprovalHistory,
    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly serviceRequestRepository: typeof ServiceRequest,
    @Inject(KEYNAMES.ESTIMATES)
    private readonly estimateRepository: typeof Estimate,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(KEYNAMES.SERVICE_APPOINTMENTS)
    private readonly serviceAppointmentRepository: typeof ServiceAppointment,
    @Inject(KEYNAMES.JOB_SHEET_INSTANCES)
    private readonly jobSheetInstanceRepository: typeof JobSheetInstance,
    @Inject(KEYNAMES.JOB_SHEET_TEMPLATES)
    private readonly jobSheetTemplateRepository: typeof JobSheetTemplate,
    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
    filters?: { document_type?: string; status?: string; approver_id?: string; document_id?: string },
  ): Promise<PageDto<DocumentApproval>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (filters?.document_type) where.document_type = filters.document_type;
    if (filters?.status) where.status = filters.status;
    if (filters?.approver_id) where.approver_id = filters.approver_id;
    if (filters?.document_id) where.document_id = filters.document_id;

    const { count, rows } = await this.approvalRepository.findAndCountAll({
      where,
      include: [
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: WorkflowTemplate, attributes: ['id', 'name', 'document_type'] },
      ],
      order: [['order_no', 'ASC'], ['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      distinct: true,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<DocumentApproval> {
    const approval = await this.approvalRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: WorkflowTemplate, attributes: ['id', 'name', 'document_type'] },
      ],
    });
    if (!approval) {
      throw new NotFoundException('Document approval not found');
    }
    return approval;
  }

  async createDocumentApprovals(
    tenantId: string,
    dto: CreateDocumentApprovalsDto,
  ): Promise<DocumentApproval[]> {
    // Fetch the workflow template (needed for version even when using custom approvers)
    const template = await this.templateRepository.findOne({
      where: { id: dto.workflow_id, tenant_id: tenantId, is_deleted: false, is_active: true },
      include: [
        {
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        },
      ],
    });

    if (!template) {
      throw new NotFoundException('Active workflow template not found');
    }

    let approvalRecords: Array<Record<string, unknown>>;

    if (dto.approver_ids && dto.approver_ids.length > 0) {
      // Use specific approver IDs provided by the caller (e.g., assigned technician)
      approvalRecords = dto.approver_ids.map((approverId, index) => ({
        tenant_id: tenantId,
        document_id: dto.document_id,
        document_type: dto.document_type,
        workflow_id: dto.workflow_id,
        workflow_version: template.version,
        approver_id: approverId,
        order_no: index + 1,
        status: ApprovalStatusEnum.PENDING,
        due_date: dto.due_date || null,
      }));
    } else {
      // Use workflow template approvers (standard flow)
      if (!template.approvers || template.approvers.length === 0) {
        throw new BadRequestException('Workflow template has no active approvers');
      }

      // Filter approvers by amount threshold if amount is provided
      let eligibleApprovers = template.approvers;
      if (dto.amount !== undefined) {
        eligibleApprovers = template.approvers.filter((approver) => {
          const minOk = approver.amount_threshold_min === null || dto.amount! >= approver.amount_threshold_min;
          const maxOk = approver.amount_threshold_max === null || dto.amount! <= approver.amount_threshold_max;
          return minOk && maxOk;
        });
      }

      if (eligibleApprovers.length === 0) {
        throw new BadRequestException('No approvers match the amount threshold for this document');
      }

      // Sort by order_no
      eligibleApprovers.sort((a, b) => a.order_no - b.order_no);

      approvalRecords = eligibleApprovers.map((approver) => ({
        tenant_id: tenantId,
        document_id: dto.document_id,
        document_type: dto.document_type,
        workflow_id: dto.workflow_id,
        workflow_version: template.version,
        approver_id: approver.approver_id,
        order_no: approver.order_no,
        status: ApprovalStatusEnum.PENDING,
        due_date: dto.due_date || null,
      }));
    }

    const approvals = await this.approvalRepository.bulkCreate(approvalRecords);

    // Notify the first approver (lowest order_no) that review is needed
    const firstApproverId = approvalRecords[0].approver_id as string;
    try {
      await this.notifyApproverForDocument(
        tenantId,
        firstApproverId,
        dto.document_id,
        dto.document_type,
        'Approval Required',
        `A ${dto.document_type.replace(/_/g, ' ').toLowerCase()} has been submitted for your approval.`,
      );
    } catch (error) {
      this.logger.warn(`Failed to notify first approver ${firstApproverId}: ${error.message}`);
    }

    return approvals;
  }

  async processApproval(
    id: string,
    tenantId: string,
    actorId: string,
    dto: ProcessApprovalDto,
  ): Promise<DocumentApproval> {
    const approval = await this.findById(id, tenantId);

    // Verify the actor is the approver (or delegated)
    if (approval.approver_id !== actorId) {
      throw new BadRequestException('You are not authorized to process this approval');
    }

    // Check that approval is still PENDING
    if (approval.status !== ApprovalStatusEnum.PENDING) {
      throw new BadRequestException(`Approval has already been processed with status: ${approval.status}`);
    }

    // Verify sequence: all previous approvers must have completed
    const previousApprovals = await this.approvalRepository.findAll({
      where: {
        document_id: approval.document_id,
        tenant_id: tenantId,
        order_no: { [Op.lt]: approval.order_no },
        is_deleted: false,
      },
    });

    const hasPendingPrevious = previousApprovals.some(
      (a) => a.status === ApprovalStatusEnum.PENDING,
    );
    if (hasPendingPrevious) {
      throw new BadRequestException('Previous approvers have not completed their review');
    }

    const oldStatus = approval.status;
    let newStatus: string;

    switch (dto.action) {
      case ApprovalActionEnum.APPROVE:
        newStatus = ApprovalStatusEnum.APPROVED;
        break;
      case ApprovalActionEnum.REJECT:
        newStatus = ApprovalStatusEnum.REJECTED;
        break;
      case ApprovalActionEnum.REQUEST_CORRECTION:
        newStatus = ApprovalStatusEnum.CORRECTION_REQUIRED;
        break;
      case ApprovalActionEnum.SKIP:
        newStatus = ApprovalStatusEnum.SKIPPED;
        break;
      default:
        throw new BadRequestException(`Invalid action: ${dto.action}`);
    }

    // Update the approval
    await approval.update({
      status: newStatus,
      comments: dto.comments || null,
      action_date: new Date(),
    });

    // Record history
    await this.historyRepository.create({
      tenant_id: tenantId,
      approval_id: id,
      document_id: approval.document_id,
      action: dto.action,
      old_status: oldStatus,
      new_status: newStatus,
      actor_id: actorId,
      comments: dto.comments || null,
      ip_address: dto.ip_address || null,
    });

    // If rejected, cascade: reject all subsequent pending approvals
    if (newStatus === ApprovalStatusEnum.REJECTED) {
      await this.approvalRepository.update(
        { status: ApprovalStatusEnum.SKIPPED, action_date: new Date() },
        {
          where: {
            document_id: approval.document_id,
            tenant_id: tenantId,
            order_no: { [Op.gt]: approval.order_no },
            status: ApprovalStatusEnum.PENDING,
            is_deleted: false,
          },
        },
      );
    }

    // Post-processing: notify next approver or update document status
    try {
      await this.handlePostApprovalActions(
        tenantId,
        approval.document_id,
        approval.document_type,
        newStatus,
        approval.order_no,
      );
    } catch (error) {
      this.logger.warn(`Post-approval action failed: ${error.message}`);
    }

    return this.findById(id, tenantId);
  }

  async bulkProcessApproval(
    tenantId: string,
    actorId: string,
    dto: BulkProcessApprovalDto,
  ): Promise<{ processed: number; failed: string[] }> {
    const failed: string[] = [];
    let processed = 0;

    for (const approvalId of dto.approval_ids) {
      try {
        await this.processApproval(approvalId, tenantId, actorId, {
          action: dto.action,
          comments: dto.comments,
          ip_address: dto.ip_address,
        });
        processed++;
      } catch {
        failed.push(approvalId);
      }
    }

    return { processed, failed };
  }

  async delegateApproval(
    id: string,
    tenantId: string,
    actorId: string,
    dto: DelegateApprovalDto,
  ): Promise<DocumentApproval> {
    const approval = await this.findById(id, tenantId);

    if (approval.approver_id !== actorId) {
      throw new BadRequestException('You are not authorized to delegate this approval');
    }

    if (approval.status !== ApprovalStatusEnum.PENDING) {
      throw new BadRequestException('Only pending approvals can be delegated');
    }

    const oldApproverId = approval.approver_id;

    await approval.update({
      approver_id: dto.delegate_to_id,
      delegated_from_id: oldApproverId,
    });

    // Record delegation in history
    await this.historyRepository.create({
      tenant_id: tenantId,
      approval_id: id,
      document_id: approval.document_id,
      action: ApprovalActionEnum.DELEGATE,
      old_status: approval.status,
      new_status: approval.status,
      actor_id: actorId,
      comments: dto.comments || `Delegated from ${oldApproverId} to ${dto.delegate_to_id}`,
      ip_address: dto.ip_address || null,
    });

    return this.findById(id, tenantId);
  }

  async getApprovalsByDocument(
    documentId: string,
    tenantId: string,
  ): Promise<DocumentApproval[]> {
    return this.approvalRepository.findAll({
      where: { document_id: documentId, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: User, as: 'approver', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: WorkflowTemplate, attributes: ['id', 'name'] },
      ],
      order: [['order_no', 'ASC']],
    });
  }

  async getMyPendingApprovals(
    tenantId: string,
    approverId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<DocumentApproval>> {
    return this.findAllPaginated(tenantId, pageOptionsDto, {
      approver_id: approverId,
      status: ApprovalStatusEnum.PENDING,
    });
  }

  async getMyApprovals(
    tenantId: string,
    approverId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<DocumentApproval>> {
    return this.findAllPaginated(tenantId, pageOptionsDto, {
      approver_id: approverId,
    });
  }

  async getApprovalHistory(
    approvalId: string,
    tenantId: string,
  ): Promise<ApprovalHistory[]> {
    return this.historyRepository.findAll({
      where: { approval_id: approvalId, tenant_id: tenantId },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async getHistoryByDocument(
    documentId: string,
    tenantId: string,
  ): Promise<ApprovalHistory[]> {
    return this.historyRepository.findAll({
      where: { document_id: documentId, tenant_id: tenantId },
      include: [
        { model: User, attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  async getDashboardStats(tenantId: string, approverId?: string): Promise<Record<string, unknown>> {
    const baseWhere: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };
    if (approverId) baseWhere.approver_id = approverId;

    const [pending, approved, rejected, total] = await Promise.all([
      this.approvalRepository.count({ where: { ...baseWhere, status: ApprovalStatusEnum.PENDING } }),
      this.approvalRepository.count({ where: { ...baseWhere, status: ApprovalStatusEnum.APPROVED } }),
      this.approvalRepository.count({ where: { ...baseWhere, status: ApprovalStatusEnum.REJECTED } }),
      this.approvalRepository.count({ where: baseWhere }),
    ]);

    // Get overdue approvals (past due_date and still pending)
    const overdue = await this.approvalRepository.count({
      where: {
        ...baseWhere,
        status: ApprovalStatusEnum.PENDING,
        due_date: { [Op.lt]: new Date() },
      },
    });

    return {
      pending,
      approved,
      rejected,
      total,
      overdue,
      approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  }

  /**
   * Auto-complete all PENDING ESTIMATE approvals for a document.
   * Called when the estimate creator saves/updates the estimate.
   */
  async completeEstimateApprovals(
    documentId: string,
    tenantId: string,
    actorId: string,
  ): Promise<void> {
    const pendingApprovals = await this.approvalRepository.findAll({
      where: {
        document_id: documentId,
        document_type: DocumentTypeEnum.ESTIMATE,
        tenant_id: tenantId,
        status: ApprovalStatusEnum.PENDING,
        is_deleted: false,
      },
    });

    for (const approval of pendingApprovals) {
      await approval.update({
        status: ApprovalStatusEnum.APPROVED,
        comments: 'Estimate created',
        action_date: new Date(),
      });

      await this.historyRepository.create({
        tenant_id: tenantId,
        approval_id: approval.id,
        document_id: documentId,
        action: ApprovalActionEnum.APPROVE,
        old_status: ApprovalStatusEnum.PENDING,
        new_status: ApprovalStatusEnum.APPROVED,
        actor_id: actorId,
        comments: 'Estimate created',
      });
    }

    if (pendingApprovals.length > 0) {
      this.logger.log(`Auto-completed ${pendingApprovals.length} ESTIMATE approval(s) for document ${documentId}`);
    }
  }

  /**
   * Auto-complete all PENDING JOB_SHEET (CREATE) approvals for a document.
   * Called when the job sheet creator submits the draft for review.
   */
  async completeJobSheetApprovals(
    documentId: string,
    tenantId: string,
    actorId: string,
  ): Promise<void> {
    const pendingApprovals = await this.approvalRepository.findAll({
      where: {
        document_id: documentId,
        document_type: DocumentTypeEnum.JOB_SHEET,
        tenant_id: tenantId,
        status: ApprovalStatusEnum.PENDING,
        is_deleted: false,
      },
    });

    for (const approval of pendingApprovals) {
      await approval.update({
        status: ApprovalStatusEnum.APPROVED,
        comments: 'Job sheet completed',
        action_date: new Date(),
      });

      await this.historyRepository.create({
        tenant_id: tenantId,
        approval_id: approval.id,
        document_id: documentId,
        action: ApprovalActionEnum.APPROVE,
        old_status: ApprovalStatusEnum.PENDING,
        new_status: ApprovalStatusEnum.APPROVED,
        actor_id: actorId,
        comments: 'Job sheet completed',
      });
    }

    if (pendingApprovals.length > 0) {
      this.logger.log(`Auto-completed ${pendingApprovals.length} JOB_SHEET approval(s) for document ${documentId}`);
    }
  }

  /**
   * Auto-complete all PENDING SCHEDULE approvals for a document.
   * Called when an admin assigns a technician to an appointment.
   */
  async completeScheduleApprovals(
    documentId: string,
    tenantId: string,
    actorId: string,
  ): Promise<void> {
    const pendingApprovals = await this.approvalRepository.findAll({
      where: {
        document_id: documentId,
        document_type: DocumentTypeEnum.SCHEDULE,
        tenant_id: tenantId,
        status: ApprovalStatusEnum.PENDING,
        is_deleted: false,
      },
    });

    for (const approval of pendingApprovals) {
      await approval.update({
        status: ApprovalStatusEnum.APPROVED,
        comments: 'Schedule approved via assignment',
        action_date: new Date(),
      });

      await this.historyRepository.create({
        tenant_id: tenantId,
        approval_id: approval.id,
        document_id: documentId,
        action: ApprovalActionEnum.APPROVE,
        old_status: ApprovalStatusEnum.PENDING,
        new_status: ApprovalStatusEnum.APPROVED,
        actor_id: actorId,
        comments: 'Schedule approved via assignment',
      });
    }

    if (pendingApprovals.length > 0) {
      this.logger.log(`Auto-completed ${pendingApprovals.length} SCHEDULE approval(s) for document ${documentId}`);
    }
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const approval = await this.findById(id, tenantId);
    await approval.update({ is_deleted: true });
  }

  private async handlePostApprovalActions(
    tenantId: string,
    documentId: string,
    documentType: string,
    newStatus: string,
    currentOrderNo: number,
  ): Promise<void> {
    if (newStatus === ApprovalStatusEnum.APPROVED) {
      // Check if there's a next pending approver
      const nextApproval = await this.approvalRepository.findOne({
        where: {
          document_id: documentId,
          tenant_id: tenantId,
          status: ApprovalStatusEnum.PENDING,
          order_no: { [Op.gt]: currentOrderNo },
          is_deleted: false,
        },
        order: [['order_no', 'ASC']],
      });

      if (nextApproval) {
        // Notify next approver
        await this.notifyApproverForDocument(
          tenantId,
          nextApproval.approver_id,
          documentId,
          documentType,
          'Approval Required',
          'A document is awaiting your approval. The previous approver has approved it.',
        );
      } else {
        // All approvers done — update document status
        await this.updateDocumentStatusOnCompletion(tenantId, documentId, documentType, 'approved');
      }
    } else if (newStatus === ApprovalStatusEnum.REJECTED) {
      // Notify about rejection (update document status to reflect rejection)
      await this.updateDocumentStatusOnCompletion(tenantId, documentId, documentType, 'rejected');
    }
  }

  private async updateDocumentStatusOnCompletion(
    tenantId: string,
    documentId: string,
    documentType: string,
    outcome: 'approved' | 'rejected',
  ): Promise<void> {
    // ── Service Request fully approved ──────────────────────────────────────
    if (documentType === DocumentTypeEnum.SERVICE_REQUEST) {
      const sr = await this.serviceRequestRepository.findOne({
        where: { id: documentId, tenant_id: tenantId, is_deleted: false },
      });
      if (sr) {
        if (outcome === 'approved') {
          await sr.update({ status: 'approved' });
          this.logger.log(`Service request ${documentId} status updated to approved`);

          // Auto-create estimate from SR and notify estimate creator
          await this.autoCreateEstimateFromSR(tenantId, sr);
        }
        if (outcome === 'rejected') {
          await sr.update({ status: 'rejected' });
          this.logger.log(`Service request ${documentId} status updated to rejected`);
        }
      }
    }

    // ── Work Order fully approved / rejected ─────────────────────────────────
    if (documentType === DocumentTypeEnum.WORK_ORDER) {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id: documentId, tenant_id: tenantId, is_deleted: false },
      });
      if (workOrder) {
        if (outcome === 'approved') {
          await workOrder.update({ status: 'scheduled' });
          this.logger.log(`Work order ${documentId} status updated to scheduled after full approval`);

          // Auto-create a service appointment (unassigned, status: scheduled)
          // This will appear in the Dispatch Board's "New / Assign" tab
          await this.autoCreateAppointmentFromWO(tenantId, workOrder);

          // Auto-create a job sheet instance (draft) + document approval entries
          // Uses JOB_SHEET / CREATE workflow template (same pattern as estimate draft)
          await this.autoCreateJobSheetFromWO(tenantId, workOrder);

          // Notify the assigned user that the WO is now scheduled
          if (workOrder.assigned_to) {
            await this.notifyApproverForDocument(
              tenantId,
              workOrder.assigned_to,
              documentId,
              documentType,
              'Work Order Approved & Scheduled',
              `Work order ${workOrder.wo_number || documentId} has been approved and moved to Scheduled.`,
            );
          }

          // Notify the designated schedule assigner to assign a technician
          await this.notifyScheduleCreator(tenantId, workOrder);
        } else {
          // Rejection: work order stays in current state so user can re-submit
          if (workOrder.assigned_to) {
            await this.notifyApproverForDocument(
              tenantId,
              workOrder.assigned_to,
              documentId,
              documentType,
              'Work Order Approval Rejected',
              `Work order ${workOrder.wo_number || documentId} was rejected during the approval process. Please review and re-submit for approval.`,
            );
          }
        }
      }
    }

    // ── Schedule (Service Appointment) fully approved / rejected ──────────────
    if (documentType === DocumentTypeEnum.SCHEDULE) {
      const appointment = await this.serviceAppointmentRepository.findOne({
        where: { id: documentId, tenant_id: tenantId, is_deleted: false },
      });
      if (appointment) {
        if (outcome === 'approved') {
          await appointment.update({ status: 'scheduled' });
          this.logger.log(`Service appointment ${documentId} status updated to scheduled after tech approval`);

          if (appointment.agent_id) {
            await this.notifyApproverForDocument(
              tenantId,
              appointment.agent_id,
              documentId,
              documentType,
              'Schedule Approved',
              `Your schedule has been approved. You can now start your trip.`,
            );
          }
        } else {
          await appointment.update({ status: 'cancelled' });
          this.logger.log(`Service appointment ${documentId} status updated to cancelled after tech rejection`);

          // Notify admins/dispatchers that the tech rejected the schedule
          try {
            const adminsAndDispatchers = await this.usersService.findAdminsAndDispatchers(tenantId);
            for (const user of adminsAndDispatchers) {
              await this.notificationsService.create(tenantId, {
                user_id: user.id,
                type: 'schedule_rejected',
                title: 'Schedule Rejected by Technician',
                body: `A technician has rejected the appointment ${documentId}. The appointment has been cancelled.`,
                data: {
                  entity_type: 'schedule',
                  entity_id: documentId,
                  document_type: DocumentTypeEnum.SCHEDULE,
                },
                channel: 'in_app',
              });
            }
          } catch (err) {
            this.logger.warn(`Failed to notify admins about schedule rejection: ${err.message}`);
          }
        }
      }
    }

    // ── Job Sheet creation (JOB_SHEET / CREATE type) completed — start JOB_SHEET_APPROVAL workflow ─
    if (documentType === DocumentTypeEnum.JOB_SHEET) {
      if (outcome === 'approved') {
        this.logger.log(`JOB_SHEET creation approval completed for ${documentId}. Starting JOB_SHEET_APPROVAL workflow.`);
        await this.startJobSheetApprovalWorkflow(tenantId, documentId);
      }
    }

    // ── Job Sheet approval workflow (JOB_SHEET_APPROVAL) completed ─────────────
    if (documentType === DocumentTypeEnum.JOB_SHEET_APPROVAL) {
      const jobSheet = await this.jobSheetInstanceRepository.findOne({
        where: { id: documentId, tenant_id: tenantId, is_deleted: false },
      });
      if (jobSheet) {
        if (outcome === 'approved') {
          await jobSheet.update({ status: 'approved' });
          this.logger.log(`Job sheet ${documentId} approved — status set to 'approved'`);
        } else if (outcome === 'rejected') {
          await jobSheet.update({ status: 'draft' });
          this.logger.log(`Job sheet ${documentId} rejected — status reverted to 'draft'`);

          // Create a fresh set of JOB_SHEET_APPROVAL records so the job sheet
          // re-appears in the Drafts / Approvals tabs for re-submission
          try {
            const template = await this.templateRepository.findOne({
              where: {
                tenant_id: tenantId,
                document_type: DocumentTypeEnum.JOB_SHEET_APPROVAL,
                is_active: true,
                is_deleted: false,
              },
              include: [{
                model: WorkflowApprover,
                where: { is_deleted: false, is_active: true },
                required: false,
              }],
              order: [['created_at', 'DESC']],
            });

            if (template?.approvers?.length) {
              await this.createDocumentApprovals(tenantId, {
                document_id: jobSheet.id,
                document_type: DocumentTypeEnum.JOB_SHEET_APPROVAL,
                workflow_id: template.id,
              });
              this.logger.log(`Created new JOB_SHEET_APPROVAL records for rejected job sheet ${documentId}`);
            }
          } catch (err) {
            this.logger.warn(`Failed to create new approval records after job sheet rejection: ${err.message}`);
          }
        }
      }
    }

    // ── Estimate creation (ESTIMATE type) completed — start ESTIMATE_APPROVAL workflow ─
    if (documentType === DocumentTypeEnum.ESTIMATE) {
      if (outcome === 'approved') {
        this.logger.log(`ESTIMATE creation approval completed for ${documentId}. Starting ESTIMATE_APPROVAL workflow.`);
        await this.startEstimateApprovalWorkflow(tenantId, documentId);
      }
    }

    // ── Estimate approval workflow completed ─────────────────────────────────
    if (documentType === DocumentTypeEnum.ESTIMATE_APPROVAL) {
      const estimate = await this.estimateRepository.findOne({
        where: { id: documentId, tenant_id: tenantId, is_deleted: false },
      });
      if (estimate) {
        if (outcome === 'approved') {
          await estimate.update({ status: 'approved' });
          this.logger.log(`Estimate ${documentId} approved — status set to 'approved'`);

          // Notify the estimate creator that it was approved
          if (estimate.created_by) {
            await this.notifyApproverForDocument(
              tenantId,
              estimate.created_by,
              documentId,
              documentType,
              'Estimate Approved',
              `Estimate ${estimate.estimate_number || documentId} has been approved.`,
            );
          }

          // Notify the contact (customer) about the approved estimate
          if (estimate.contact_id) {
            const contactUser = await User.findOne({
              where: { id: estimate.contact_id } as Record<string, unknown>,
              attributes: ['id', 'email', 'first_name'],
            });
            if (contactUser?.email) {
              const cf = (estimate.custom_fields as Record<string, unknown>) || {};
              const title = (cf.title as string) || estimate.estimate_number || 'Estimate';
              await this.emailService.sendEmail(
                contactUser.email,
                `Estimate Ready for Review: ${title}`,
                `Hi ${contactUser.first_name || 'there'},\n\nYour estimate "${title}" (${estimate.estimate_number || ''}) is ready for your review.\n\nPlease log in to review and approve the estimate.\n`,
              );
            }
          }
        } else if (outcome === 'rejected') {
          await estimate.update({ status: 'rejected' });
          this.logger.log(`Estimate ${documentId} rejected — status set to 'rejected'`);

          // Notify the estimate creator that it was rejected
          if (estimate.created_by) {
            await this.notifyApproverForDocument(
              tenantId,
              estimate.created_by,
              documentId,
              documentType,
              'Estimate Rejected',
              `Estimate ${estimate.estimate_number || documentId} has been rejected. Please review and revise if needed.`,
            );
          }
        }
      }
    }

    // ── Invoice fully approved / rejected (Step 8) ───────────────────────────
    if (documentType === DocumentTypeEnum.INVOICE) {
      const invoice = await this.invoiceRepository.findOne({
        where: { id: documentId, tenant_id: tenantId, is_deleted: false },
      });
      if (invoice) {
        const finalStatus = outcome === 'approved' ? 'approved' : 'rejected';
        await invoice.update({ status: finalStatus });
        this.logger.log(`Invoice ${documentId} ${outcome} — status set to '${finalStatus}'`);
        // Notify whoever submitted/created the invoice of the outcome
        const submitterId = (invoice.custom_fields as Record<string, unknown>)?.submitted_by as string;
        if (submitterId) {
          await this.notifyApproverForDocument(
            tenantId,
            submitterId,
            documentId,
            documentType,
            outcome === 'approved' ? 'Invoice Approved' : 'Invoice Rejected',
            outcome === 'approved'
              ? `Invoice ${invoice.invoice_number || documentId} has been approved. You can collect payment.`
              : `Invoice ${invoice.invoice_number || documentId} was rejected. Please review.`,
          );
        }
      }
    }
  }

  /**
   * Submit a document for approval using the tenant's active workflow template
   * for that document type (looked up by document_type). Used by the invoice
   * submit-for-approval flow (Step 8).
   */
  async submitByDocumentType(
    tenantId: string,
    params: { document_id: string; document_type: DocumentTypeEnum; amount?: number },
  ): Promise<DocumentApproval[]> {
    const template = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        document_type: params.document_type,
        is_active: true,
        is_deleted: false,
      },
    });
    if (!template) {
      throw new BadRequestException(
        `No active approval workflow is configured for ${params.document_type}. Please create one first.`,
      );
    }
    return this.createDocumentApprovals(tenantId, {
      document_id: params.document_id,
      document_type: params.document_type,
      workflow_id: template.id,
      amount: params.amount,
    });
  }

  private generateEstimateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `EST-${year}-${random}`;
  }

  private async autoCreateEstimateFromSR(
    tenantId: string,
    sr: ServiceRequest,
  ): Promise<void> {
    try {
      // Find the assigned estimate creator (first approver in ESTIMATE workflow)
      let assignedCreatorId: string | null = null;
      const estimateTemplate = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.ESTIMATE,
          is_active: true,
          is_deleted: false,
        },
        include: [{
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        }],
        order: [['created_at', 'DESC']],
      });
      if (estimateTemplate?.approvers?.length) {
        const sorted = [...estimateTemplate.approvers].sort((a, b) => a.order_no - b.order_no);
        assignedCreatorId = sorted[0].approver_id;
      }

      // Auto-create a draft estimate with SR details
      const estimate = await this.estimateRepository.create({
        tenant_id: tenantId,
        contact_id: sr.contact_id || null,
        request_id: sr.id,
        estimate_number: this.generateEstimateNumber(),
        status: 'draft',
        created_by: assignedCreatorId,
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        custom_fields: {
          title: `Estimate for: ${sr.subject || 'Service Request'}`,
          priority: sr.priority || '',
          auto_created_from_sr: sr.id,
        },
      });

      this.logger.log(`Auto-created estimate ${estimate.id} from SR ${sr.id}`);

      // Create ESTIMATE document approval records so the task appears in Document Approvals page
      if (estimateTemplate) {
        try {
          await this.createDocumentApprovals(tenantId, {
            document_id: estimate.id,
            document_type: DocumentTypeEnum.ESTIMATE,
            workflow_id: estimateTemplate.id,
          });
          this.logger.log(`Created ESTIMATE approval records for estimate ${estimate.id}`);
        } catch (err) {
          this.logger.warn(`Failed to create ESTIMATE approval records for estimate ${estimate.id}: ${err.message}`);
        }
      }

      // Notify the estimate creator (first approver in ESTIMATE workflow)
      await this.notifyApproversToCreateEstimate(tenantId, sr.id, sr.subject, estimate.id);
    } catch (error) {
      this.logger.error(`Failed to auto-create estimate from SR ${sr.id}: ${error.message}`);
    }
  }

  private async startEstimateApprovalWorkflow(tenantId: string, estimateId: string): Promise<void> {
    try {
      const template = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.ESTIMATE_APPROVAL,
          is_active: true,
          is_deleted: false,
        },
        include: [{
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        }],
        order: [['created_at', 'DESC']],
      });

      if (!template || !template.approvers?.length) return;

      await this.createDocumentApprovals(tenantId, {
        document_id: estimateId,
        document_type: DocumentTypeEnum.ESTIMATE_APPROVAL,
        workflow_id: template.id,
      });
    } catch (error) {
      this.logger.warn(`Failed to start ESTIMATE_APPROVAL workflow for estimate ${estimateId}: ${error.message}`);
    }
  }

  private async startJobSheetApprovalWorkflow(tenantId: string, jobSheetId: string): Promise<void> {
    try {
      const template = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.JOB_SHEET_APPROVAL,
          is_active: true,
          is_deleted: false,
        },
        include: [{
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        }],
        order: [['created_at', 'DESC']],
      });

      if (!template || !template.approvers?.length) {
        this.logger.warn(`No active JOB_SHEET_APPROVAL template found for tenant ${tenantId}. Skipping.`);
        return;
      }

      await this.createDocumentApprovals(tenantId, {
        document_id: jobSheetId,
        document_type: DocumentTypeEnum.JOB_SHEET_APPROVAL,
        workflow_id: template.id,
      });

      this.logger.log(`Started JOB_SHEET_APPROVAL workflow for job sheet ${jobSheetId}`);
    } catch (error) {
      this.logger.warn(`Failed to start JOB_SHEET_APPROVAL workflow for job sheet ${jobSheetId}: ${error.message}`);
    }
  }

  private async notifyApproversToCreateEstimate(
    tenantId: string,
    documentId: string,
    srSubject: string,
    estimateId?: string,
  ): Promise<void> {
    // Find the active ESTIMATE workflow template for this tenant
    const estimateTemplate = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        document_type: DocumentTypeEnum.ESTIMATE,
        is_active: true,
        is_deleted: false,
      },
      include: [
        {
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    if (!estimateTemplate || !estimateTemplate.approvers || estimateTemplate.approvers.length === 0) {
      this.logger.warn(`No active ESTIMATE workflow template found for tenant ${tenantId}. Skipping create-estimate notification.`);
      return;
    }

    // Get the first approver in the Estimate workflow (order_no = 1 / lowest)
    const sortedApprovers = [...estimateTemplate.approvers].sort((a, b) => a.order_no - b.order_no);
    const estimateCreator = sortedApprovers[0];

    // Send in-app + email notification
    try {
      await this.notificationsService.create(tenantId, {
        user_id: estimateCreator.approver_id,
        type: 'create_estimate',
        title: 'Estimate Created — Add Line Items',
        body: `Service Request "${srSubject}" has been approved. An estimate has been auto-created. Please add line items and send it to the customer.`,
        data: {
          document_id: documentId,
          document_type: DocumentTypeEnum.SERVICE_REQUEST,
          service_request_id: documentId,
          estimate_id: estimateId || null,
          navigate_to: estimateId ? 'edit_estimate' : 'create_estimate',
        },
        channel: 'in_app',
      });
    } catch (error) {
      this.logger.warn(`Failed to send create-estimate in-app notification: ${error.message}`);
    }

    try {
      const creatorUser = await User.findByPk(estimateCreator.approver_id, {
        attributes: ['id', 'email', 'first_name'],
      });
      if (creatorUser?.email) {
        await this.emailService.sendEmail(
          creatorUser.email,
          'Create Estimate',
          `Hi ${creatorUser.first_name || 'there'},\n\nService Request "${srSubject}" has been approved.\nPlease log in to create an estimate for it.\n`,
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to send create-estimate email notification: ${error.message}`);
    }

  }

  private async autoCreateAppointmentFromWO(
    tenantId: string,
    workOrder: WorkOrder,
  ): Promise<void> {
    try {
      // Check if an appointment already exists for this WO
      const existing = await this.serviceAppointmentRepository.findOne({
        where: { work_order_id: workOrder.id, tenant_id: tenantId, is_deleted: false },
      });
      if (existing) {
        this.logger.log(`Appointment already exists for WO ${workOrder.id}, skipping auto-create`);
        return;
      }

      // Check appointment limit before auto-scheduling
      const tenant = await Tenant.findByPk(tenantId);
      if (tenant) {
        const customMax = (tenant.custom_limits as Record<string, number | null> | null)?.max_appointments_monthly ?? null;
        let limit: number | null = customMax;

        if (limit === null && tenant.subscription_plan_id) {
          const plan = await SubscriptionPlan.findByPk(tenant.subscription_plan_id);
          limit = plan?.max_appointments_monthly ?? null;
        }

        if (limit !== null) {
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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
            this.logger.warn(
              `Tenant ${tenantId} reached monthly appointment limit (${currentCount}/${limit}). Skipping auto-creation.`,
            );
            return;
          }
        }
      }

      // Use WO scheduled dates if available, otherwise default to tomorrow 9am-5pm
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultStart = new Date(tomorrow.setHours(9, 0, 0, 0));
      const defaultEnd = new Date(tomorrow.setHours(17, 0, 0, 0));

      const scheduledStart = workOrder.scheduled_start || defaultStart;
      const scheduledEnd = workOrder.scheduled_end || defaultEnd;

      const appointment = await this.serviceAppointmentRepository.create({
        tenant_id: tenantId,
        work_order_id: workOrder.id,
        agent_id: null, // Unassigned — admin will assign via Dispatch Board
        status: 'scheduled',
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        notes: `Auto-created from approved work order ${workOrder.wo_number || workOrder.id}`,
      });

      this.logger.log(`Auto-created appointment ${appointment.id} for WO ${workOrder.id} (unassigned, status: scheduled)`);
    } catch (error) {
      this.logger.error(`Failed to auto-create appointment from WO ${workOrder.id}: ${error.message}`);
    }
  }

  async autoCreateJobSheetFromWO(
    tenantId: string,
    workOrder: WorkOrder,
  ): Promise<void> {
    try {
      // Check if a job sheet instance already exists for this WO
      const existing = await this.jobSheetInstanceRepository.findOne({
        where: { work_order_id: workOrder.id, tenant_id: tenantId, is_deleted: false },
      });
      if (existing) {
        this.logger.log(`Job sheet instance already exists for WO ${workOrder.id}, skipping auto-create`);
        return;
      }

      // 1. Find the JOB_SHEET / CREATE workflow template + approvers
      //    (same as estimate pattern: find ESTIMATE workflow first)
      const jobSheetWorkflow = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.JOB_SHEET,
          document_category: 'CREATE',
          is_active: true,
          is_deleted: false,
        },
        include: [{
          model: WorkflowApprover,
          where: { is_deleted: false, is_active: true },
          required: false,
        }],
        order: [['created_at', 'DESC']],
      });

      // Get the assigned creator (first approver in JOB_SHEET/CREATE workflow)
      let assignedCreatorId: string | null = null;
      if (jobSheetWorkflow?.approvers?.length) {
        const sorted = [...jobSheetWorkflow.approvers].sort((a, b) => a.order_no - b.order_no);
        assignedCreatorId = sorted[0].approver_id;
      }

      // 2. Find the first active job sheet template for this tenant (optional)
      const jsTemplate = await this.jobSheetTemplateRepository.findOne({
        where: { tenant_id: tenantId, is_active: true, is_deleted: false },
        order: [['created_at', 'DESC']],
      });

      // 3. Auto-create a draft job sheet instance (same as estimate draft creation)
      const jobSheetInstance = await this.jobSheetInstanceRepository.create({
        tenant_id: tenantId,
        template_id: jsTemplate?.id || null,
        work_order_id: workOrder.id,
        status: 'draft',
        custom_fields: {
          title: `Job Sheet for: ${workOrder.wo_number || 'Work Order'}`,
          auto_created_from_wo: workOrder.id,
          wo_number: workOrder.wo_number || null,
          assigned_creator: assignedCreatorId,
        },
      });

      this.logger.log(`Auto-created job sheet instance ${jobSheetInstance.id} from WO ${workOrder.id}`);

      // 4. Create JOB_SHEET document approval records (same as ESTIMATE approval records)
      if (jobSheetWorkflow) {
        try {
          await this.createDocumentApprovals(tenantId, {
            document_id: jobSheetInstance.id,
            document_type: DocumentTypeEnum.JOB_SHEET,
            workflow_id: jobSheetWorkflow.id,
          });
          this.logger.log(`Created JOB_SHEET approval records for job sheet instance ${jobSheetInstance.id}`);
        } catch (err) {
          this.logger.warn(`Failed to create JOB_SHEET approval records for instance ${jobSheetInstance.id}: ${err.message}`);
        }
      }

      // 5. Notify the assigned creator (first approver in JOB_SHEET/CREATE workflow)
      await this.notifyJobSheetCreator(tenantId, workOrder, jobSheetInstance.id);
    } catch (error) {
      this.logger.error(`Failed to auto-create job sheet from WO ${workOrder.id}: ${error.message}`);
    }
  }

  private async notifyJobSheetCreator(
    tenantId: string,
    workOrder: WorkOrder,
    jobSheetInstanceId: string,
  ): Promise<void> {
    // Find the active JOB_SHEET/CREATE workflow template for this tenant
    const jobSheetWorkflow = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        document_type: DocumentTypeEnum.JOB_SHEET,
        document_category: 'CREATE',
        is_active: true,
        is_deleted: false,
      },
      include: [{
        model: WorkflowApprover,
        where: { is_deleted: false, is_active: true },
        required: false,
      }],
      order: [['created_at', 'DESC']],
    });

    if (!jobSheetWorkflow?.approvers?.length) {
      this.logger.warn(`No active JOB_SHEET/CREATE workflow found for tenant ${tenantId}. Skipping job-sheet-creator notification.`);
      return;
    }

    // Get the first approver (the assigned job sheet creator)
    const sortedApprovers = [...jobSheetWorkflow.approvers].sort((a, b) => a.order_no - b.order_no);
    const jobSheetCreator = sortedApprovers[0];

    // In-app notification
    try {
      await this.notificationsService.create(tenantId, {
        user_id: jobSheetCreator.approver_id,
        type: 'create_job_sheet',
        title: 'Job Sheet Created — Complete Items',
        body: `Work Order "${workOrder.wo_number || workOrder.id}" has been approved. A job sheet has been auto-created. Please complete the job sheet items.`,
        data: {
          document_id: workOrder.id,
          document_type: DocumentTypeEnum.WORK_ORDER,
          work_order_id: workOrder.id,
          job_sheet_instance_id: jobSheetInstanceId,
          navigate_to: 'edit_job_sheet',
        },
        channel: 'in_app',
      });
    } catch (error) {
      this.logger.warn(`Failed to send create-job-sheet in-app notification: ${error.message}`);
    }

    // Email notification
    try {
      const creatorUser = await User.findByPk(jobSheetCreator.approver_id, {
        attributes: ['id', 'email', 'first_name'],
      });
      if (creatorUser?.email) {
        await this.emailService.sendEmail(
          creatorUser.email,
          'Job Sheet Created — Complete Items',
          `Hi ${creatorUser.first_name || 'there'},\n\nWork Order "${workOrder.wo_number || workOrder.id}" has been approved.\nA job sheet has been auto-created. Please log in to complete the job sheet items.\n`,
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to send create-job-sheet email notification: ${error.message}`);
    }
  }

  private async notifyScheduleCreator(tenantId: string, workOrder: WorkOrder): Promise<void> {
    try {
      // Find the designated schedule assigner from the SCHEDULE workflow template
      const assignerId = await this.getScheduleAssignerId(tenantId);

      if (!assignerId) {
        this.logger.warn(
          `No SCHEDULE workflow assigner found for tenant ${tenantId}. Skipping schedule-creator notification.`,
        );
        return;
      }

      await this.notificationsService.create(tenantId, {
        user_id: assignerId,
        type: 'create_schedule',
        title: 'Work Order Approved — Please Assign Technician',
        body: `Work order ${workOrder.wo_number || workOrder.id} has been approved. Please assign a technician in the Dispatch Board.`,
        data: {
          document_type: DocumentTypeEnum.SCHEDULE,
          entity_type: 'schedule',
          navigate_to: 'create_schedule',
          work_order_id: workOrder.id,
          work_order_number: workOrder.wo_number || workOrder.id,
        },
        channel: 'in_app',
      });

      this.logger.log(
        `Schedule-creator notification sent to designated assigner ${assignerId} for work order ${workOrder.id}`,
      );
    } catch (error) {
      this.logger.warn(`Failed to notify schedule creator for work order ${workOrder.id}: ${error.message}`);
    }
  }

  /**
   * Find the designated schedule assigner (first approver in active SCHEDULE workflow).
   * Uses raw query to avoid issues with Sequelize include + required:false picking
   * a template that has no approvers.
   */
  private async getScheduleAssignerId(tenantId: string): Promise<string | null> {
    const results = (await this.templateRepository.sequelize!.query(
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
      {
        replacements: { tenantId },
        type: (this.templateRepository.sequelize as any).constructor.QueryTypes.SELECT,
      },
    ) as unknown) as Array<{ approver_id: string }>;

    if (!results || results.length === 0) {
      this.logger.warn(`No SCHEDULE workflow approver found for tenant ${tenantId}`);
      return null;
    }

    this.logger.log(`SCHEDULE workflow assigner for tenant ${tenantId}: ${results[0].approver_id}`);
    return results[0].approver_id;
  }

  private getEntityType(documentType: string): string {
    const map: Record<string, string> = {
      WORK_ORDER: 'work_order',
      SERVICE_REQUEST: 'service_request',
      ESTIMATE: 'estimate',
      ESTIMATE_APPROVAL: 'estimate',
      SCHEDULE: 'schedule',
      FIELD_WORKFLOW: 'field_workflow',
      JOB_SHEET: 'job_sheet',
    };
    return map[documentType] || 'work_order';
  }

  private async notifyApproverForDocument(
    tenantId: string,
    approverId: string,
    documentId: string,
    documentType: string,
    title: string,
    body: string,
  ): Promise<void> {
    // In-app notification
    try {
      await this.notificationsService.create(tenantId, {
        user_id: approverId,
        type: 'approval_required',
        title,
        body,
        data: {
          document_id: documentId,
          document_type: documentType,
          entity_type: this.getEntityType(documentType),
          entity_id: documentId,
        },
        channel: 'in_app',
      });
    } catch (error) {
      this.logger.warn(`Failed to create in-app notification: ${error.message}`);
    }

    // Email notification
    try {
      const approverUser = await User.findByPk(approverId, {
        attributes: ['id', 'email', 'first_name'],
      });
      if (approverUser?.email) {
        await this.emailService.sendEmail(
          approverUser.email,
          title,
          `Hi ${approverUser.first_name || 'Approver'},\n\n${body}\n\nPlease log in to review and take action.`,
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to send email notification: ${error.message}`);
    }
  }
}
