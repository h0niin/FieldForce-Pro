import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WorkOrderAttachment } from './work_order_attachments.entity';
import { CreateWorkOrderAttachmentDto } from './dto/work_order_attachments_create.dto';
import { UpdateWorkOrderAttachmentDto } from './dto/work_order_attachments_update.dto';
import { WorkOrderAttachmentQueryDto } from './dto/work_order_attachments_query.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WorkOrderAttachmentsService {
  constructor(
    @Inject(KEYNAMES.WORK_ORDER_ATTACHMENTS)
    private readonly workOrderAttachmentRepository: typeof WorkOrderAttachment,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: WorkOrderAttachmentQueryDto,
  ): Promise<PageDto<WorkOrderAttachment>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.work_order_id) {
      where.work_order_id = pageOptionsDto.work_order_id;
    }

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { file_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { file_type: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.workOrderAttachmentRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<WorkOrderAttachment[]> {
    return this.workOrderAttachmentRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<WorkOrderAttachment[]> {
    return this.workOrderAttachmentRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<WorkOrderAttachment> {
    const attachment = await this.workOrderAttachmentRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!attachment) {
      throw new NotFoundException('Work order attachment not found');
    }
    return attachment;
  }

  async create(tenantId: string, dto: CreateWorkOrderAttachmentDto): Promise<WorkOrderAttachment> {
    return this.workOrderAttachmentRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWorkOrderAttachmentDto,
  ): Promise<WorkOrderAttachment> {
    const attachment = await this.findById(id, tenantId);
    await attachment.update(dto);
    return attachment;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const attachment = await this.findById(id, tenantId);
    await attachment.update({ is_deleted: true });
  }
}
