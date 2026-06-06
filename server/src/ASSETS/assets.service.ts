import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Asset } from './assets.entity';
import { CreateAssetDto } from './dto/assets_create.dto';
import { UpdateAssetDto } from './dto/assets_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Op } from 'sequelize';

@Injectable()
export class AssetsService {
  constructor(
    @Inject(KEYNAMES.ASSETS)
    private readonly assetRepository: typeof Asset,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Asset>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { serial_number: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { model: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { manufacturer: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { category: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.assetRepository.findAndCountAll({
      where,
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name'] },
        { model: ServiceLocation, attributes: ['id', 'address'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Asset[]> {
    return this.assetRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: Contact, attributes: ['id', 'first_name', 'last_name', 'email', 'phone'] },
        { model: ServiceLocation, attributes: ['id', 'address', 'lat', 'lng'] },
      ],
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  async create(tenantId: string, dto: CreateAssetDto): Promise<Asset> {
    return this.assetRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.findById(id, tenantId);
    await asset.update(dto);
    return asset;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const asset = await this.findById(id, tenantId);
    await asset.update({ is_deleted: true });
  }

  async findServiceHistory(
    assetId: string,
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<WorkOrder>> {
    const { count, rows } = await this.workOrderRepository.findAndCountAll({
      where: { asset_id: assetId, tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });
    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }
}
