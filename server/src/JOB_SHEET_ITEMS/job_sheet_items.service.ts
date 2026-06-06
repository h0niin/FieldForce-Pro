import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { JobSheetItem } from './job_sheet_items.entity';
import { CreateJobSheetItemDto } from './dto/job_sheet_items_create.dto';
import { UpdateJobSheetItemDto } from './dto/job_sheet_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class JobSheetItemsService {
  constructor(
    @Inject(KEYNAMES.JOB_SHEET_ITEMS)
    private readonly jobSheetItemRepository: typeof JobSheetItem,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<JobSheetItem>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { label: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { value: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.jobSheetItemRepository.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<JobSheetItem[]> {
    return this.jobSheetItemRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
  }

  async findByInstanceId(instanceId: string, tenantId: string): Promise<JobSheetItem[]> {
    return this.jobSheetItemRepository.findAll({
      where: { instance_id: instanceId, tenant_id: tenantId, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<JobSheetItem> {
    const item = await this.jobSheetItemRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!item) {
      throw new NotFoundException('Job sheet item not found');
    }
    return item;
  }

  async create(tenantId: string, dto: CreateJobSheetItemDto): Promise<JobSheetItem> {
    return this.jobSheetItemRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateJobSheetItemDto,
  ): Promise<JobSheetItem> {
    const item = await this.findById(id, tenantId);
    await item.update(dto);
    return item;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const item = await this.findById(id, tenantId);
    await item.update({ is_deleted: true });
  }
}
