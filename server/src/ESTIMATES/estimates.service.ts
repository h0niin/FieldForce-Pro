import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  GoneException,
  Logger,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Estimate } from './estimates.entity';
import { CreateEstimateDto } from './dto/estimates_create.dto';
import { UpdateEstimateDto } from './dto/estimates_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Contact } from '../CONTACTS/contacts.entity';
import { EstimateLineItem } from '../ESTIMATE_LINE_ITEMS/estimate_line_items.entity';
import { Op } from 'sequelize';
import { WorkflowTemplate } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.entity';
import { WorkflowApprover } from '../WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.entity';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { DocumentTypeEnum } from '../shared/enums/workflow.enum';
import { WorkOrdersService } from '../WORK_ORDERS/work_orders.service';
import { WorkOrderLineItemsService } from '../WORK_ORDER_LINE_ITEMS/work_order_line_items.service';
import { NotificationsService } from '../NOTIFICATIONS/notifications.service';
import { EmailService } from '../shared/services/email.service';
import { User } from '../USERS/users.entity';
import { Invoice } from '../INVOICES/invoices.entity';
import { InvoiceLineItem } from '../INVOICE_LINE_ITEMS/invoice_line_items.entity';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'pending_approval'],
  pending_approval: ['approved', 'rejected'],
  sent: ['viewed', 'approved', 'rejected', 'expired'],
  viewed: ['approved', 'rejected', 'expired'],
  approved: ['converted_to_wo', 'converted_to_invoice'],
  rejected: ['draft'],
  expired: ['draft'],
  converted_to_wo: [],
  converted_to_invoice: [],
};

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    @Inject(KEYNAMES.ESTIMATES)
    private readonly estimateRepository: typeof Estimate,
    @Inject(KEYNAMES.WORKFLOW_TEMPLATES)
    private readonly templateRepository: typeof WorkflowTemplate,
    @Inject(KEYNAMES.INVOICES)
    private readonly invoiceRepository: typeof Invoice,
    @Inject(KEYNAMES.INVOICE_LINE_ITEMS)
    private readonly invoiceLineItemRepository: typeof InvoiceLineItem,
    private readonly documentApprovalsService: DocumentApprovalsService,
    private readonly workOrdersService: WorkOrdersService,
    private readonly workOrderLineItemsService: WorkOrderLineItemsService,
    @Optional() private readonly notificationsService: NotificationsService,
    @Optional() private readonly emailService: EmailService,
    @Inject(KEYNAMES.USERS) @Optional() private readonly userRepository: typeof User,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
    status?: string,
    excludeStatus?: string,
    createdBy?: string,
  ): Promise<PageDto<Estimate>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

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

    // Filter by creator (used for draft ownership — only the assigned creator sees their drafts)
    if (createdBy) {
      where.created_by = createdBy;
    }

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { estimate_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.estimateRepository.findAndCountAll({
      where,
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      distinct: true,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findMyDrafts(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Estimate>> {
    // Find draft estimates where the current user is the assigned creator
    // (either via created_by field OR via pending ESTIMATE approval assigned to them)
    const documentIds = await this.estimateRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'ESTIMATE'
         AND da.status = 'PENDING'`,
      {
        replacements: { tenantId, userId },
        type: 'SELECT' as unknown as undefined,
      },
    ) as unknown as Array<{ document_id: string }>;

    const approvalIds = documentIds.map((r) => r.document_id);

    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
      status: 'draft',
      [Op.or as unknown as string]: [
        { created_by: userId },
        ...(approvalIds.length > 0 ? [{ id: { [Op.in]: approvalIds } }] : []),
      ],
    };

    if (pageOptionsDto.search) {
      where[Op.and as unknown as string] = [
        {
          [Op.or as unknown as string]: [
            { estimate_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
            { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
          ],
        },
      ];
    }

    const { count, rows } = await this.estimateRepository.findAndCountAll({
      where,
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findMyPendingApprovals(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Estimate>> {
    const documentIds = await this.estimateRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'ESTIMATE_APPROVAL'
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
        { estimate_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { notes: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.estimateRepository.findAndCountAll({
      where,
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Estimate[]> {
    return this.estimateRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Estimate> {
    const estimate = await this.estimateRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        {
          model: EstimateLineItem,
          as: 'line_items',
          where: { is_deleted: false },
          required: false,
        },
      ],
      order: [
        [{ model: EstimateLineItem, as: 'line_items' }, 'sort_order', 'ASC'],
      ],
    });
    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }
    return estimate;
  }

  private generateEstimateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `EST-${year}-${random}`;
  }

  async create(tenantId: string, dto: CreateEstimateDto, userId?: string): Promise<Estimate> {
    const estimate = await this.estimateRepository.create({
      tenant_id: tenantId,
      created_by: userId || null,
      ...dto,
      // These come AFTER the spread so dto's undefined values don't win
      estimate_number: dto.estimate_number || this.generateEstimateNumber(),
      status: dto.status ?? 'draft',
    });

    // Auto-trigger ESTIMATE_APPROVAL workflow on creation
    await this.autoStartApprovalWorkflow(tenantId, estimate);

    return estimate;
  }

  private async autoStartApprovalWorkflow(tenantId: string, estimate: Estimate): Promise<void> {
    try {
      const template = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.ESTIMATE_APPROVAL,
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

      if (!template) {
        this.logger.warn(`No active ESTIMATE_APPROVAL template found for tenant ${tenantId} — skipping approval chain`);
        return;
      }

      if (!template.approvers || template.approvers.length === 0) {
        this.logger.warn(`ESTIMATE_APPROVAL template "${template.name}" has no active approvers — skipping`);
        return;
      }

      // createDocumentApprovals also notifies the first approver automatically
      await this.documentApprovalsService.createDocumentApprovals(tenantId, {
        document_id: estimate.id,
        document_type: DocumentTypeEnum.ESTIMATE_APPROVAL,
        workflow_id: template.id,
      });

      this.logger.log(`Started ESTIMATE_APPROVAL workflow for estimate ${estimate.id}`);
    } catch (error) {
      this.logger.error(`Failed to start approval workflow for estimate ${estimate.id}: ${error.message}`);
    }
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateEstimateDto,
    userId?: string,
  ): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);
    await estimate.update(dto);

    // Auto-complete any ESTIMATE type approvals (the "create estimate" task)
    // so it shows as completed in Document Approvals page
    if (userId) {
      await this.documentApprovalsService.completeEstimateApprovals(id, tenantId, userId);
    }

    // Start ESTIMATE_APPROVAL workflow if not already started
    // (covers estimates auto-created from SR that are now being saved by the creator)
    const existingApprovals = await this.documentApprovalsService.getApprovalsByDocument(id, tenantId);
    const hasApprovalWorkflow = existingApprovals.some(
      (a) => a.document_type === 'ESTIMATE_APPROVAL',
    );
    if (!hasApprovalWorkflow) {
      await this.autoStartApprovalWorkflow(tenantId, estimate);
    }

    return estimate;
  }

  async updateStatus(
    id: string,
    tenantId: string,
    newStatus: string,
  ): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);
    const currentStatus = estimate.status;

    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions) {
      throw new BadRequestException(
        `No transitions allowed from status '${currentStatus}'`,
      );
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ')}`,
      );
    }

    await estimate.update({ status: newStatus });
    return estimate;
  }

  async sendToCustomer(id: string, tenantId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    if (estimate.status !== 'draft') {
      throw new BadRequestException('Only draft estimates can be sent to customers');
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await estimate.update({ status: 'sent', public_token: token, public_token_expires_at: expires });

    return estimate;
  }

  async generatePublicLink(id: string, tenantId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    const terminalStatuses = ['rejected', 'expired', 'converted_to_wo'];
    if (terminalStatuses.includes(estimate.status)) {
      throw new BadRequestException(
        `Cannot generate a sign link for an estimate with status '${estimate.status}'`,
      );
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updatePayload: Record<string, unknown> = {
      public_token: token,
      public_token_expires_at: expires,
    };

    // If still draft, also mark as sent
    if (estimate.status === 'draft') {
      updatePayload.status = 'sent';
    }

    await estimate.update(updatePayload);
    return estimate;
  }

  async getByPublicToken(token: string): Promise<Estimate> {
    const estimate = await this.estimateRepository.findOne({
      where: { public_token: token, is_deleted: false },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        {
          model: EstimateLineItem,
          as: 'line_items',
          where: { is_deleted: false },
          required: false,
        },
      ],
      order: [[{ model: EstimateLineItem, as: 'line_items' }, 'sort_order', 'ASC']],
    });

    if (!estimate) {
      throw new NotFoundException('Link not found or expired');
    }
    if (estimate.public_token_expires_at < new Date()) {
      throw new GoneException('This link has expired');
    }
    return estimate;
  }

  async signByToken(token: string, signatureDataUrl: string): Promise<Estimate> {
    const estimate = await this.getByPublicToken(token);

    if (!['sent', 'viewed', 'approved'].includes(estimate.status)) {
      throw new BadRequestException('This estimate has already been processed');
    }

    // If already signed, don't allow re-signing
    if (estimate.signature_url) {
      throw new BadRequestException('This estimate has already been signed');
    }

    const customFields = { ...(estimate.custom_fields || {}) };
    customFields['signed_at'] = new Date().toISOString();
    customFields['signer_contact_id'] = estimate.contact_id;

    await estimate.update({
      signature_url: signatureDataUrl,
      status: 'approved',
      custom_fields: customFields,
    });

    // Auto-convert to work order after customer signs
    try {
      await this.convertToWorkOrder(estimate.id, estimate.tenant_id, {
        locationId: (customFields['location_id'] as string) || undefined,
      });
      this.logger.log(`Estimate ${estimate.id} auto-converted to work order after customer signature`);
    } catch (err) {
      this.logger.warn(`Auto-convert to WO failed for estimate ${estimate.id}: ${(err as Error).message}`);
    }

    return estimate;
  }

  async revertToDraft(id: string, tenantId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    const revertableStatuses = ['sent', 'viewed', 'approved', 'rejected'];
    if (!revertableStatuses.includes(estimate.status)) {
      throw new BadRequestException(
        `Cannot revert an estimate with status '${estimate.status}' back to draft`,
      );
    }

    // Remove sign/rejection metadata from custom_fields
    const customFields = { ...(estimate.custom_fields || {}) };
    delete customFields['signed_at'];
    delete customFields['signer_contact_id'];
    delete customFields['rejection_reason'];
    delete customFields['rejected_at'];
    delete customFields['rejected_by'];

    await estimate.update({
      status: 'draft',
      public_token: null,
      public_token_expires_at: null,
      signature_url: null,
      custom_fields: customFields,
    });

    return estimate;
  }

  async rejectByToken(token: string, reason?: string): Promise<Estimate> {
    const estimate = await this.getByPublicToken(token);

    if (!['sent', 'viewed', 'approved'].includes(estimate.status)) {
      throw new BadRequestException('This estimate has already been processed');
    }

    // If already signed, don't allow rejection
    if (estimate.signature_url) {
      throw new BadRequestException('This estimate has already been signed and cannot be declined');
    }

    const customFields = { ...(estimate.custom_fields || {}) };
    customFields['rejection_reason'] = reason || null;
    customFields['rejected_at'] = new Date().toISOString();
    customFields['rejected_by'] = 'customer';

    await estimate.update({ status: 'rejected', custom_fields: customFields });
    return estimate;
  }

  async recordApproval(
    id: string,
    tenantId: string,
    signatureUrl?: string,
  ): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    if (!['sent', 'viewed'].includes(estimate.status)) {
      throw new BadRequestException('Only sent or viewed estimates can be approved');
    }

    await estimate.update({
      status: 'approved',
      signature_url: signatureUrl || null,
    });

    return estimate;
  }

  async recordRejection(
    id: string,
    tenantId: string,
    reason?: string,
  ): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    if (!['sent', 'viewed'].includes(estimate.status)) {
      throw new BadRequestException('Only sent or viewed estimates can be rejected');
    }

    // Store rejection reason in custom_fields
    const customFields = estimate.custom_fields || {};
    customFields['rejection_reason'] = reason;

    await estimate.update({
      status: 'rejected',
      custom_fields: customFields,
    });

    return estimate;
  }

  async convertToWorkOrder(
    id: string,
    tenantId: string,
    options?: {
      assignedTo?: string;
      scheduledDate?: string;
      priority?: string;
      category?: string;
      locationId?: string;
    },
  ) {
    const estimate = await this.findById(id, tenantId);

    if (estimate.status !== 'approved') {
      throw new BadRequestException('Only approved estimates can be converted to work orders');
    }

    // Create the work order
    const workOrder = await this.workOrdersService.create(tenantId, {
      estimate_id: estimate.id,
      contact_id: estimate.contact_id,
      location_id: options?.locationId,
      summary: `Work Order from Estimate ${estimate.estimate_number || estimate.id.slice(0, 8)}`,
      description: estimate.notes || undefined,
      status: 'new',
      priority: (options?.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      category: options?.category,
      assigned_to: options?.assignedTo,
      scheduled_start: estimate.scheduled_start ? estimate.scheduled_start.toISOString() : options?.scheduledDate,
      custom_fields: {
        converted_from_estimate: estimate.id,
        estimate_number: estimate.estimate_number,
        estimate_total: estimate.total,
      },
    });

    // Copy estimate line items → work order line items
    if (estimate.line_items && estimate.line_items.length > 0) {
      await Promise.all(
        estimate.line_items.map((item) =>
          this.workOrderLineItemsService.create(tenantId, {
            work_order_id: workOrder.id,
            type: item.type as 'service' | 'part' | 'travel',
            name: item.name,
            description: item.description || undefined,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            tax_rate: Number(item.tax_rate),
            discount: Number(item.discount),
            total: Number(item.total),
            sort_order: item.sort_order ?? 0,
          }),
        ),
      );
    }

    // Mark the estimate as converted
    await estimate.update({ status: 'converted_to_wo' });

    // Auto-start WORK_ORDER approval workflow — notifies the first approver
    await this.autoStartWOApprovalWorkflow(tenantId, workOrder.id);

    return workOrder;
  }

  private async autoStartWOApprovalWorkflow(tenantId: string, workOrderId: string): Promise<void> {
    try {
      const template = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.WORK_ORDER,
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

      if (!template) {
        this.logger.warn(`No active WORK_ORDER workflow template found for tenant ${tenantId} — skipping WO approval notification`);
        return;
      }

      if (!template.approvers || template.approvers.length === 0) {
        this.logger.warn(`WORK_ORDER template "${template.name}" has no active approvers — skipping`);
        return;
      }

      // createDocumentApprovals automatically notifies the first approver
      await this.documentApprovalsService.createDocumentApprovals(tenantId, {
        document_id: workOrderId,
        document_type: DocumentTypeEnum.WORK_ORDER,
        workflow_id: template.id,
      });

      this.logger.log(`Started WORK_ORDER approval workflow for WO ${workOrderId}`);
    } catch (error) {
      this.logger.error(`Failed to start approval workflow for WO ${workOrderId}: ${error.message}`);
    }
  }

  async getAssignedCreatorId(tenantId: string): Promise<string | null> {
    const template = await this.templateRepository.findOne({
      where: {
        tenant_id: tenantId,
        document_type: DocumentTypeEnum.ESTIMATE_APPROVAL,
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

    if (!template || !template.approvers || template.approvers.length === 0) {
      return null;
    }

    // Return the first approver's ID as the designated estimate creator
    const sorted = [...template.approvers].sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));
    return sorted[0].approver_id;
  }

  async findByWorkOrder(workOrderId: string, tenantId: string): Promise<Estimate[]> {
    return this.estimateRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        {
          model: EstimateLineItem,
          as: 'line_items',
          where: { is_deleted: false },
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findByServiceRequest(requestId: string, tenantId: string): Promise<Estimate[]> {
    return this.estimateRepository.findAll({
      where: { request_id: requestId, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        {
          model: EstimateLineItem,
          as: 'line_items',
          where: { is_deleted: false },
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  // ── On-site estimate approval flow ──────────────────────────────────────

  async getPendingInternalApprovals(tenantId: string, pageOptionsDto: PageOptionsDto): Promise<PageDto<Estimate>> {
    return this.findAllPaginated(tenantId, pageOptionsDto, 'pending_internal_approval');
  }

  async submitForInternalApproval(id: string, tenantId: string, userId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);
    if (!['draft', 'revision_required'].includes(estimate.status)) {
      throw new BadRequestException('Only draft or revision_required on-site estimates can be submitted for internal approval');
    }
    if (estimate.estimate_type !== 'on_site') {
      throw new BadRequestException('Only on-site estimates use the internal approval flow');
    }

    await estimate.update({ status: 'pending_internal_approval', awaiting_internal_approval: true });

    // Notify all admins/managers in the tenant
    await this.notifyTenantAdmins(tenantId, estimate, userId, 'internal_approval_requested');

    return estimate;
  }

  async internalApprove(id: string, tenantId: string, approverId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);
    if (estimate.status !== 'pending_internal_approval') {
      throw new BadRequestException('Estimate is not pending internal approval');
    }

    const token = randomUUID();
    const tokenExpires = new Date();
    tokenExpires.setDate(tokenExpires.getDate() + 7);

    await estimate.update({
      status: 'pending_customer_approval',
      internal_approval_status: 'approved',
      internal_approved_by: approverId,
      internal_approved_at: new Date(),
      awaiting_internal_approval: false,
      awaiting_customer_approval: true,
      public_token: token,
      public_token_expires_at: tokenExpires,
    });

    // Notify technician (the estimate creator)
    if (estimate.created_by && this.notificationsService) {
      await this.notificationsService.create(tenantId, {
        user_id: estimate.created_by,
        type: 'estimate_internal_approved',
        title: 'Estimate Approved by Manager',
        body: `Your on-site estimate ${estimate.estimate_number} has been approved by the manager and sent to the customer for approval.`,
        data: { estimate_id: estimate.id, work_order_id: estimate.work_order_id },
        channel: 'in_app',
      });
    }

    // Send email to customer if contact has email
    const contact = estimate.contact;
    if (contact?.email && this.emailService) {
      const approvalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/estimate/approve/${token}`;
      await this.emailService.sendEmail(
        contact.email,
        `Estimate ${estimate.estimate_number} Ready for Your Approval`,
        `<p>Dear ${contact.first_name || 'Customer'},</p>
         <p>A service estimate of <strong>${estimate.total}</strong> has been prepared for your review.</p>
         <p>Please review and approve the estimate by clicking the link below:</p>
         <p><a href="${approvalUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Review & Approve Estimate</a></p>
         <p>This link expires in 7 days.</p>
         <p>Estimate Number: ${estimate.estimate_number}<br/>Total Amount: ${estimate.total}</p>`,
      );
    }

    return estimate;
  }

  async internalReject(id: string, tenantId: string, reason: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);
    if (estimate.status !== 'pending_internal_approval') {
      throw new BadRequestException('Estimate is not pending internal approval');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    await estimate.update({
      status: 'revision_required',
      internal_approval_status: 'rejected',
      internal_rejection_reason: reason,
      awaiting_internal_approval: false,
    });

    // Notify the technician with the reason
    if (estimate.created_by && this.notificationsService) {
      await this.notificationsService.create(tenantId, {
        user_id: estimate.created_by,
        type: 'estimate_revision_required',
        title: 'Estimate Revision Required',
        body: `Your on-site estimate ${estimate.estimate_number} requires revision. Reason: ${reason}`,
        data: { estimate_id: estimate.id, work_order_id: estimate.work_order_id, reason },
        channel: 'in_app',
      });
    }

    return estimate;
  }

  async customerApproveByToken(token: string, customerName: string, signature: string): Promise<Estimate> {
    const estimate = await this.getByPublicToken(token);
    if (estimate.status !== 'pending_customer_approval') {
      throw new BadRequestException('This estimate is not pending customer approval');
    }
    if (!customerName?.trim()) throw new BadRequestException('Customer name is required');
    if (!signature?.trim()) throw new BadRequestException('Signature is required');

    await estimate.update({
      status: 'customer_approved',
      customer_approval_status: 'approved',
      customer_approved_at: new Date(),
      customer_name_signed: customerName,
      customer_signature: signature,
      awaiting_customer_approval: false,
    });

    // Auto-update WO to in_progress
    if (estimate.work_order_id) {
      try {
        await this.workOrdersService.updateStatus(estimate.work_order_id, estimate.tenant_id, { status: 'in_progress' });
      } catch (e) {
        this.logger.warn(`Could not auto-update WO ${estimate.work_order_id} to in_progress: ${e.message}`);
      }
    }

    // Notify technician and manager
    if (this.notificationsService) {
      if (estimate.created_by) {
        await this.notificationsService.create(estimate.tenant_id, {
          user_id: estimate.created_by,
          type: 'estimate_customer_approved',
          title: 'Customer Approved the Estimate',
          body: `Customer approved estimate ${estimate.estimate_number}. You can now proceed with the work.`,
          data: { estimate_id: estimate.id, work_order_id: estimate.work_order_id },
          channel: 'in_app',
        });
      }
      await this.notifyTenantAdmins(estimate.tenant_id, estimate, estimate.created_by, 'customer_approved');
    }

    return estimate;
  }

  async customerRejectByToken(token: string, reason: string): Promise<Estimate> {
    const estimate = await this.getByPublicToken(token);
    if (estimate.status !== 'pending_customer_approval') {
      throw new BadRequestException('This estimate is not pending customer approval');
    }

    await estimate.update({
      status: 'customer_rejected',
      customer_approval_status: 'rejected',
      customer_rejection_reason: reason,
      awaiting_customer_approval: false,
    });

    // Notify technician and manager
    if (this.notificationsService) {
      if (estimate.created_by) {
        await this.notificationsService.create(estimate.tenant_id, {
          user_id: estimate.created_by,
          type: 'estimate_customer_rejected',
          title: 'Customer Declined the Estimate',
          body: `Customer declined estimate ${estimate.estimate_number}. Reason: ${reason || 'No reason given'}`,
          data: { estimate_id: estimate.id, work_order_id: estimate.work_order_id, reason },
          channel: 'in_app',
        });
      }
      await this.notifyTenantAdmins(estimate.tenant_id, estimate, estimate.created_by, 'customer_rejected');
    }

    return estimate;
  }

  private async notifyTenantAdmins(
    tenantId: string,
    estimate: Estimate,
    excludeUserId: string,
    eventType: string,
  ): Promise<void> {
    if (!this.notificationsService || !this.userRepository) return;
    try {
      const admins = await this.userRepository.findAll({
        where: { tenant_id: tenantId, is_deleted: false, is_active: true },
        attributes: ['id'],
      });

      const titles: Record<string, string> = {
        internal_approval_requested: 'New On-Site Estimate Awaiting Review',
        customer_approved: 'Customer Approved Estimate',
        customer_rejected: 'Customer Declined Estimate',
      };
      const bodies: Record<string, string> = {
        internal_approval_requested: `An on-site estimate ${estimate.estimate_number} (Total: ${estimate.total}) is waiting for your review.`,
        customer_approved: `Customer approved estimate ${estimate.estimate_number}. Work Order can now proceed.`,
        customer_rejected: `Customer declined estimate ${estimate.estimate_number}. Please follow up.`,
      };

      for (const admin of admins) {
        if (admin.id === excludeUserId) continue;
        await this.notificationsService.create(tenantId, {
          user_id: admin.id,
          type: `estimate_${eventType}`,
          title: titles[eventType] || 'Estimate Update',
          body: bodies[eventType] || `Estimate ${estimate.estimate_number} updated.`,
          data: { estimate_id: estimate.id, work_order_id: estimate.work_order_id },
          channel: 'in_app',
        });
      }
    } catch (e) {
      this.logger.warn(`notifyTenantAdmins failed: ${e.message}`);
    }
  }

  async submitForApproval(id: string, tenantId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    if (estimate.status !== 'draft') {
      throw new BadRequestException('Only draft estimates can be submitted for approval');
    }

    await estimate.update({ status: 'pending_approval' });
    return estimate;
  }

  async adminApprove(id: string, tenantId: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    if (!['draft', 'pending_approval'].includes(estimate.status)) {
      throw new BadRequestException(
        `Only draft or pending-approval estimates can be approved. Current status: '${estimate.status}'`,
      );
    }

    await estimate.update({ status: 'approved' });
    return estimate;
  }

  async adminReject(id: string, tenantId: string, reason?: string): Promise<Estimate> {
    const estimate = await this.findById(id, tenantId);

    if (!['draft', 'pending_approval'].includes(estimate.status)) {
      throw new BadRequestException(
        `Only draft or pending-approval estimates can be rejected. Current status: '${estimate.status}'`,
      );
    }

    const customFields = { ...(estimate.custom_fields || {}) };
    if (reason) {
      customFields['rejection_reason'] = reason;
      customFields['rejected_at'] = new Date().toISOString();
    }

    await estimate.update({ status: 'rejected', custom_fields: customFields });
    return estimate;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const lastInvoice = await this.invoiceRepository.findOne({
      where: { tenant_id: tenantId },
      order: [['created_at', 'DESC']],
      attributes: ['invoice_number'],
    });

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const match = (lastInvoice.invoice_number as string).match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `INV-${nextNumber.toString().padStart(6, '0')}`;
  }

  async generateInvoice(id: string, tenantId: string): Promise<Invoice> {
    const estimate = await this.findById(id, tenantId);

    // Idempotency: return existing invoice if already generated (checked before status gate
    // so repeated calls on a converted_to_invoice estimate still return the invoice)
    const existing = await this.invoiceRepository.findOne({
      where: { estimate_id: id, tenant_id: tenantId, is_deleted: false },
    });

    if (existing) {
      return existing;
    }

    if (estimate.status !== 'approved') {
      throw new BadRequestException('Only approved estimates can generate an invoice');
    }

    const lineItems = (estimate.line_items || []).map((item) => ({
      type: item.type || 'service',
      name: item.name,
      description: item.description || null,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      tax_rate: Number(item.tax_rate) || 0,
      discount_type: (item as unknown as Record<string, string>)['discount_type'] || 'fixed',
      discount: Number(item.discount) || 0,
      total: Number(item.total) || 0,
    }));

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    for (const item of lineItems) {
      subtotal += item.total;
      taxTotal += item.unit_price * item.quantity * (item.tax_rate / 100);
      discountTotal += item.discount;
    }

    if (lineItems.length === 0) {
      subtotal = Number(estimate.subtotal) || 0;
      taxTotal = Number(estimate.tax) || 0;
      discountTotal = Number(estimate.discount) || 0;
    }

    const totalAmount = subtotal + taxTotal - discountTotal;
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await this.invoiceRepository.create({
      tenant_id: tenantId,
      estimate_id: id,
      contact_id: estimate.contact_id,
      invoice_number: invoiceNumber,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'draft',
      subtotal,
      tax: taxTotal,
      discount: discountTotal,
      total: totalAmount > 0 ? totalAmount : subtotal,
      paid_amount: 0,
      currency: 'INR',
      notes: `Auto-generated from Estimate ${estimate.estimate_number || id.slice(0, 8)}`,
    });

    // Map estimate line item types to valid invoice_line_items ENUM values
    const INVOICE_LI_TYPES = new Set(['service', 'part', 'travel', 'other']);
    const mapType = (t: string): string =>
      INVOICE_LI_TYPES.has(t) ? t : t === 'labor' ? 'service' : t === 'material' || t === 'equipment' ? 'part' : 'other';

    for (const item of lineItems) {
      await this.invoiceLineItemRepository.create({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        type: mapType(item.type ?? 'service'),
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_type: item.discount_type,
        discount: item.discount,
        total: item.total,
      });
    }

    await estimate.update({ status: 'converted_to_invoice' });

    return invoice;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const estimate = await this.findById(id, tenantId);
    await estimate.update({ is_deleted: true });
  }
}
