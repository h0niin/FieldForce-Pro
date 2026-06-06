import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ServicesCatalog } from './services_catalog.entity';
import { CreateServicesCatalogDto } from './dto/services_catalog_create.dto';
import { UpdateServicesCatalogDto } from './dto/services_catalog_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class ServicesCatalogService {
  constructor(
    @Inject(KEYNAMES.SERVICES_CATALOG)
    private readonly servicesCatalogRepository: typeof ServicesCatalog,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<ServicesCatalog>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { description: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.servicesCatalogRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<ServicesCatalog[]> {
    return this.servicesCatalogRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<ServicesCatalog> {
    const service = await this.servicesCatalogRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async create(tenantId: string, dto: CreateServicesCatalogDto): Promise<ServicesCatalog> {
    // Check for duplicate service name
    const existing = await this.servicesCatalogRepository.findOne({
      where: {
        name: dto.name,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (existing) {
      throw new ConflictException('Service with this name already exists');
    }

    return this.servicesCatalogRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateServicesCatalogDto,
  ): Promise<ServicesCatalog> {
    const service = await this.findById(id, tenantId);

    // If updating name, check for duplicates
    if (dto.name && dto.name !== service.name) {
      const existing = await this.servicesCatalogRepository.findOne({
        where: {
          name: dto.name,
          tenant_id: tenantId,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new ConflictException('Service with this name already exists');
      }
    }

    await service.update(dto);
    return service;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const service = await this.findById(id, tenantId);
    await service.update({ is_deleted: true });
  }
}
