import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WorkOrderLineItem } from './work_order_line_items.entity';
import { CreateWorkOrderLineItemDto } from './dto/work_order_line_items_create.dto';
import { UpdateWorkOrderLineItemDto } from './dto/work_order_line_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class WorkOrderLineItemsService {
  constructor(
    @Inject(KEYNAMES.WORK_ORDER_LINE_ITEMS)
    private readonly workOrderLineItemRepository: typeof WorkOrderLineItem,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkOrderLineItem>> {
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

    const { count, rows } = await this.workOrderLineItemRepository.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<WorkOrderLineItem[]> {
    return this.workOrderLineItemRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
  }

  async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<WorkOrderLineItem[]> {
    return this.workOrderLineItemRepository.findAll({
      where: { work_order_id: workOrderId, tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<WorkOrderLineItem> {
    const lineItem = await this.workOrderLineItemRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!lineItem) {
      throw new NotFoundException('Work order line item not found');
    }
    return lineItem;
  }

  async create(tenantId: string, dto: CreateWorkOrderLineItemDto): Promise<WorkOrderLineItem> {
    return this.workOrderLineItemRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateWorkOrderLineItemDto,
  ): Promise<WorkOrderLineItem> {
    const lineItem = await this.findById(id, tenantId);
    await lineItem.update(dto);
    return lineItem;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const lineItem = await this.findById(id, tenantId);
    await lineItem.update({ is_deleted: true });
  }
}
