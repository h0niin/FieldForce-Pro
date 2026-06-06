import { Injectable, Inject, NotFoundException, Logger, forwardRef } from '@nestjs/common';
import { JobSheetInstance } from './job_sheet_instances.entity';
import { CreateJobSheetInstanceDto } from './dto/job_sheet_instances_create.dto';
import { UpdateJobSheetInstanceDto } from './dto/job_sheet_instances_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { DocumentTypeEnum } from '../shared/enums/workflow.enum';
import { DocumentApprovalsService } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.service';
import { WorkflowTemplate } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.entity';
import { WorkflowApprover } from '../WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.entity';
import { Op } from 'sequelize';
import { JobSheetTemplate } from '../JOB_SHEET_TEMPLATES/job_sheet_templates.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';

@Injectable()
export class JobSheetInstancesService {
  private readonly logger = new Logger(JobSheetInstancesService.name);

  constructor(
    @Inject(KEYNAMES.JOB_SHEET_INSTANCES)
    private readonly jobSheetInstanceRepository: typeof JobSheetInstance,
    @Inject(KEYNAMES.WORKFLOW_TEMPLATES)
    private readonly templateRepository: typeof WorkflowTemplate,
    @Inject(forwardRef(() => DocumentApprovalsService))
    private readonly documentApprovalsService: DocumentApprovalsService,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<JobSheetInstance>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.jobSheetInstanceRepository.findAndCountAll({
      where,
      include: [
        { model: JobSheetTemplate, attributes: ['id', 'name', 'category'] },
        { model: WorkOrder, attributes: ['id', 'wo_number', 'summary'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<JobSheetInstance[]> {
    return this.jobSheetInstanceRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findByAppointmentId(appointmentId: string, tenantId: string): Promise<JobSheetInstance[]> {
    return this.jobSheetInstanceRepository.findAll({
      where: { appointment_id: appointmentId, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: JobSheetTemplate, attributes: ['id', 'name', 'category'] },
        { model: WorkOrder, attributes: ['id', 'wo_number', 'summary'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<JobSheetInstance[]> {
    return this.jobSheetInstanceRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: JobSheetTemplate, attributes: ['id', 'name', 'category'] },
        { model: WorkOrder, attributes: ['id', 'wo_number', 'summary'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findMyDrafts(
    tenantId: string,
    userId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<JobSheetInstance>> {
    // Find draft job sheets where the current user has a pending JOB_SHEET approval
    const documentIds = await this.jobSheetInstanceRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'JOB_SHEET'
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
    };

    if (approvalIds.length > 0) {
      where.id = { [Op.in]: approvalIds };
    }

    if (pageOptionsDto.search) {
      where[Op.and as unknown as string] = [
        {
          [Op.or as unknown as string]: [
            { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
          ],
        },
      ];
    }

    const { count, rows } = await this.jobSheetInstanceRepository.findAndCountAll({
      where,
      include: [
        { model: JobSheetTemplate, attributes: ['id', 'name', 'category'] },
        { model: WorkOrder, attributes: ['id', 'wo_number', 'summary'] },
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
  ): Promise<PageDto<JobSheetInstance>> {
    const documentIds = await this.jobSheetInstanceRepository.sequelize!.query(
      `SELECT DISTINCT da.document_id
       FROM workflow_document_approvals da
       WHERE da.tenant_id = :tenantId
         AND da.approver_id = :userId
         AND da.is_deleted = false
         AND da.document_type = 'JOB_SHEET_APPROVAL'
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
        { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.jobSheetInstanceRepository.findAndCountAll({
      where,
      include: [
        { model: JobSheetTemplate, attributes: ['id', 'name', 'category'] },
        { model: WorkOrder, attributes: ['id', 'wo_number', 'summary'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<JobSheetInstance> {
    const instance = await this.jobSheetInstanceRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!instance) {
      throw new NotFoundException('Job sheet instance not found');
    }
    return instance;
  }

  async create(tenantId: string, dto: CreateJobSheetInstanceDto): Promise<JobSheetInstance> {
    return this.jobSheetInstanceRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateJobSheetInstanceDto,
    userId?: string,
  ): Promise<JobSheetInstance> {
    const instance = await this.findById(id, tenantId);
    const oldStatus = instance.status;
    await instance.update(dto);

    // When status changes to 'pending' (submitted for review):
    // 1. Auto-complete JOB_SHEET/CREATE approvals (marks the draft creation task as done)
    // 2. This triggers the JOB_SHEET_APPROVAL workflow via updateDocumentStatusOnCompletion
    if (dto.status === 'pending' && oldStatus !== 'pending') {
      if (userId) {
        await this.documentApprovalsService.completeJobSheetApprovals(id, tenantId, userId);
      }

      // Also start JOB_SHEET_APPROVAL workflow directly if no CREATE approvals existed
      const existingApprovals = await this.documentApprovalsService.getApprovalsByDocument(id, tenantId);
      const hasApprovalWorkflow = existingApprovals.some(
        (a) => a.document_type === 'JOB_SHEET_APPROVAL',
      );
      if (!hasApprovalWorkflow) {
        await this.autoStartApprovalWorkflow(tenantId, instance);
      }
    }

    return instance;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const instance = await this.findById(id, tenantId);
    await instance.update({ is_deleted: true });
  }

  private async autoStartApprovalWorkflow(tenantId: string, jobSheet: JobSheetInstance): Promise<void> {
    try {
      // Skip if PENDING JOB_SHEET_APPROVAL records already exist
      const existing = await this.jobSheetInstanceRepository.sequelize!.query(
        `SELECT 1 FROM workflow_document_approvals
         WHERE document_id = :documentId
           AND tenant_id = :tenantId
           AND document_type = 'JOB_SHEET_APPROVAL'
           AND status = 'PENDING'
           AND is_deleted = false
         LIMIT 1`,
        { replacements: { documentId: jobSheet.id, tenantId }, type: 'SELECT' as unknown as undefined },
      ) as unknown as unknown[];

      if (existing.length > 0) {
        this.logger.log(`PENDING JOB_SHEET_APPROVAL approvals already exist for ${jobSheet.id} — skipping duplicate creation`);
        return;
      }

      const template = await this.templateRepository.findOne({
        where: {
          tenant_id: tenantId,
          document_type: DocumentTypeEnum.JOB_SHEET_APPROVAL,
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
        this.logger.warn(`No active JOB_SHEET_APPROVAL workflow template found for tenant ${tenantId} — skipping approval chain`);
        return;
      }

      if (!template.approvers || template.approvers.length === 0) {
        this.logger.warn(`JOB_SHEET_APPROVAL workflow template "${template.name}" has no active approvers — skipping`);
        return;
      }

      await this.documentApprovalsService.createDocumentApprovals(tenantId, {
        document_id: jobSheet.id,
        document_type: DocumentTypeEnum.JOB_SHEET_APPROVAL,
        workflow_id: template.id,
      });

      this.logger.log(`Started JOB_SHEET_APPROVAL workflow for job sheet ${jobSheet.id}`);
    } catch (error) {
      this.logger.error(`Failed to start JOB_SHEET_APPROVAL workflow for job sheet ${jobSheet.id}: ${error.message}`);
    }
  }
}
