import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WorkflowTemplate } from './workflow_templates.entity';
import { WorkflowApprover } from '../WORKFLOW_APPROVERS/workflow_approvers.entity';
import { CreateWorkflowTemplateDto, UpdateWorkflowTemplateDto } from './dto/workflow_templates.dto';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';
import { PageDto } from '../../shared/dto/page.dto';
import { PageMetaDto } from '../../shared/dto/page-meta.dto';
import { KEYNAMES } from '../../shared/constants/keynames';
import { Op } from 'sequelize';
import { User } from '../../USERS/users.entity';

@Injectable()
export class WorkflowTemplatesService {
  constructor(
    @Inject(KEYNAMES.WORKFLOW_TEMPLATES)
    private readonly templateRepository: typeof WorkflowTemplate,
    @Inject(KEYNAMES.WORKFLOW_APPROVERS)
    private readonly approverRepository: typeof WorkflowApprover,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkflowTemplate>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.templateRepository.findAndCountAll({
      where,
      include: [
        {
          model: WorkflowApprover,
          where: { is_deleted: false },
          required: false,
          include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'] }],
        },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      distinct: true,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<WorkflowTemplate[]> {
    return this.templateRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      include: [
        {
          model: WorkflowApprover,
          where: { is_deleted: false },
          required: false,
          include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        {
          model: WorkflowApprover,
          where: { is_deleted: false },
          required: false,
          include: [{ model: User, attributes: ['id', 'first_name', 'last_name', 'email'] }],
        },
      ],
    });
    if (!template) {
      throw new NotFoundException('Workflow template not found');
    }
    return template;
  }

  async create(tenantId: string, dto: CreateWorkflowTemplateDto): Promise<WorkflowTemplate> {
    const template = await this.templateRepository.create({
      tenant_id: tenantId,
      name: dto.name,
      description: dto.description,
      document_type: dto.document_type,
      document_category: dto.document_category,
    });

    if (dto.approvers && dto.approvers.length > 0) {
      const approverData = dto.approvers.map((approver) => ({
        tenant_id: tenantId,
        workflow_template_id: template.id,
        ...approver,
      }));
      await this.approverRepository.bulkCreate(approverData);
    }

    return this.findById(template.id, tenantId);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWorkflowTemplateDto,
  ): Promise<WorkflowTemplate> {
    const template = await this.findById(id, tenantId);

    // Increment version on update
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.document_type !== undefined) updateData.document_type = dto.document_type;
    if (dto.document_category !== undefined) updateData.document_category = dto.document_category;
    updateData.version = template.version + 1;

    await template.update(updateData);

    // Replace approvers if provided
    if (dto.approvers !== undefined) {
      // Soft-delete existing approvers
      await this.approverRepository.update(
        { is_deleted: true },
        { where: { workflow_template_id: id, is_deleted: false } },
      );

      if (dto.approvers.length > 0) {
        const approverData = dto.approvers.map((approver) => ({
          tenant_id: tenantId,
          workflow_template_id: id,
          ...approver,
        }));
        await this.approverRepository.bulkCreate(approverData);
      }
    }

    return this.findById(id, tenantId);
  }

  async activate(id: string, tenantId: string): Promise<WorkflowTemplate> {
    const template = await this.findById(id, tenantId);

    // Deactivate other active templates for the same document_type in this tenant
    await this.templateRepository.update(
      { is_active: false },
      {
        where: {
          tenant_id: tenantId,
          document_type: template.document_type,
          is_active: true,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      },
    );

    await template.update({ is_active: true });
    return this.findById(id, tenantId);
  }

  async deactivate(id: string, tenantId: string): Promise<WorkflowTemplate> {
    const template = await this.findById(id, tenantId);
    await template.update({ is_active: false });
    return template;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const template = await this.findById(id, tenantId);
    await template.update({ is_deleted: true });
    // Soft-delete associated approvers
    await this.approverRepository.update(
      { is_deleted: true },
      { where: { workflow_template_id: id } },
    );
  }
}
