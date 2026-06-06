import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { PartsCatalog } from './parts_catalog.entity';
import { CreatePartsCatalogDto } from './dto/parts_catalog_create.dto';
import { UpdatePartsCatalogDto } from './dto/parts_catalog_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class PartsCatalogService {
  constructor(
    @Inject(KEYNAMES.PARTS_CATALOG)
    private readonly partsCatalogRepository: typeof PartsCatalog,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PartsCatalog>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { sku: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { supplier: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.partsCatalogRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<PartsCatalog[]> {
    return this.partsCatalogRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<PartsCatalog> {
    const part = await this.partsCatalogRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!part) {
      throw new NotFoundException('Part not found');
    }
    return part;
  }

  async create(tenantId: string, dto: CreatePartsCatalogDto): Promise<PartsCatalog> {
    // Check for duplicate part name
    const existing = await this.partsCatalogRepository.findOne({
      where: {
        name: dto.name,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (existing) {
      throw new ConflictException('Part with this name already exists');
    }

    return this.partsCatalogRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdatePartsCatalogDto,
  ): Promise<PartsCatalog> {
    const part = await this.findById(id, tenantId);

    // If updating name, check for duplicates
    if (dto.name && dto.name !== part.name) {
      const existing = await this.partsCatalogRepository.findOne({
        where: {
          name: dto.name,
          tenant_id: tenantId,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new ConflictException('Part with this name already exists');
      }
    }

    await part.update(dto);
    return part;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const part = await this.findById(id, tenantId);
    await part.update({ is_deleted: true });
  }
}
