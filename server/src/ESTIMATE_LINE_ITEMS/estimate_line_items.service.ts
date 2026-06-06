import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { EstimateLineItem } from './estimate_line_items.entity';
import { CreateEstimateLineItemDto } from './dto/estimate_line_items_create.dto';
import { UpdateEstimateLineItemDto } from './dto/estimate_line_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class EstimateLineItemsService {
  constructor(
    @Inject(KEYNAMES.ESTIMATE_LINE_ITEMS)
    private readonly estimateLineItemRepository: typeof EstimateLineItem,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<EstimateLineItem>> {
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

    const { count, rows } = await this.estimateLineItemRepository.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<EstimateLineItem[]> {
    return this.estimateLineItemRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<EstimateLineItem> {
    const lineItem = await this.estimateLineItemRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!lineItem) {
      throw new NotFoundException('Estimate line item not found');
    }
    return lineItem;
  }

  async findByEstimateId(estimateId: string, tenantId: string): Promise<EstimateLineItem[]> {
    return this.estimateLineItemRepository.findAll({
      where: {
        estimate_id: estimateId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['sort_order', 'ASC']],
    });
  }

  async create(tenantId: string, dto: CreateEstimateLineItemDto): Promise<EstimateLineItem> {
    return this.estimateLineItemRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateEstimateLineItemDto,
  ): Promise<EstimateLineItem> {
    const lineItem = await this.findById(id, tenantId);
    await lineItem.update(dto);
    return lineItem;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const lineItem = await this.findById(id, tenantId);
    await lineItem.update({ is_deleted: true });
  }
}
