import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CustomField } from './custom_fields.entity';
import { CreateCustomFieldDto } from './dto/custom_fields_create.dto';
import { UpdateCustomFieldDto } from './dto/custom_fields_update.dto';
import { BatchUpdateCustomFieldsDto } from './dto/custom_fields_batch_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class CustomFieldsService {
  constructor(
    @Inject(KEYNAMES.CUSTOM_FIELDS)
    private readonly customFieldRepository: typeof CustomField,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<CustomField>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { field_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { module: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.customFieldRepository.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<CustomField[]> {
    return this.customFieldRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['section_order', 'ASC'], ['sort_order', 'ASC'], ['created_at', 'DESC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<CustomField> {
    const field = await this.customFieldRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!field) {
      throw new NotFoundException('Custom field not found');
    }
    return field;
  }

  async findByModule(module: string, tenantId: string): Promise<CustomField[]> {
    return this.customFieldRepository.findAll({
      where: {
        module,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['section_order', 'ASC'], ['sort_order', 'ASC']],
    });
  }

  async create(tenantId: string, dto: CreateCustomFieldDto): Promise<CustomField> {
    return this.customFieldRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateCustomFieldDto,
  ): Promise<CustomField> {
    const field = await this.findById(id, tenantId);
    await field.update(dto);
    return field;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const field = await this.findById(id, tenantId);
    await field.update({ is_deleted: true });
  }

  /**
   * Batch update multiple fields at once — used by the layout drag-and-drop editor
   * to persist all reordering/property changes in a single request.
   */
  async batchUpdate(
    tenantId: string,
    dto: BatchUpdateCustomFieldsDto,
  ): Promise<{ updated: number }> {
    let updated = 0;
    for (const item of dto.fields) {
      const { id, ...patch } = item;
      const field = await this.customFieldRepository.findOne({
        where: { id, tenant_id: tenantId, is_deleted: false },
      });
      if (field) {
        await field.update(patch);
        updated++;
      }
    }
    return { updated };
  }
}
