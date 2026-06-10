import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';
import { Company } from '../COMPANIES/companies.entity';
import { generateEntityDiff } from '../utils/diff-logger.util';

@Injectable()
export class AssetsService {
  constructor(
    @Inject(KEYNAMES.ASSETS)
    private readonly assetRepository: typeof Asset,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    private readonly activityLogsService: ActivityLogsService,
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
        { model: Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'] },
        { model: ServiceLocation, as: 'location', attributes: ['id', 'address'] },
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
    try {
      const asset = await this.assetRepository.findOne({
        where: { id, tenant_id: tenantId, is_deleted: false },
        include: [
          { model: Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'] },
          { model: ServiceLocation, as: 'location', attributes: ['id', 'address', 'lat', 'lng'] },
          { model: Company, as: 'company', attributes: ['id', 'name'] },
          { model: Asset, as: 'parent_asset', attributes: ['id', 'name', 'serial_number'] },
        ],
      });
      if (!asset) {
        throw new NotFoundException('Asset not found');
      }
      return asset;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      console.error(`Error in AssetsService.findById: ${error.message}`);
      throw new BadRequestException('Failed to load asset details');
    }
  }

  async create(tenantId: string, dto: CreateAssetDto): Promise<Asset> {
    const asset = await this.assetRepository.create({
      tenant_id: tenantId,
      ...dto,
    });

    await this.activityLogsService.logActivity(tenantId, 'Asset', asset.id, 'CREATED', `Asset '${asset.name}' was created.`).catch(() => {});

    if (asset.contact_id) {
      await this.activityLogsService.logActivity(tenantId, 'Contact', asset.contact_id, 'CREATED', `Asset '${asset.name}' was assigned to this record.`).catch(() => {});
    }
    if (asset.company_id) {
      await this.activityLogsService.logActivity(tenantId, 'Company', asset.company_id, 'CREATED', `Asset '${asset.name}' was assigned to this record.`).catch(() => {});
    }

    return asset;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.findById(id, tenantId);
    
    const diffArray = generateEntityDiff(asset, dto);
    const diffString = diffArray.join(', ');
    const description = diffString !== '' ? diffString : 'Asset details were updated.';

    await asset.update(dto);

    if (diffString !== '') {
      await this.activityLogsService.logActivity(tenantId, 'Asset', asset.id, 'UPDATED', description).catch(() => {});
    }

    if (asset.contact_id && diffString !== '') {
      await this.activityLogsService.logActivity(tenantId, 'Contact', asset.contact_id, 'UPDATED', `Asset '${asset.name}': ${description}`).catch(() => {});
    }
    if (asset.company_id && diffString !== '') {
      await this.activityLogsService.logActivity(tenantId, 'Company', asset.company_id, 'UPDATED', `Asset '${asset.name}': ${description}`).catch(() => {});
    }

    return asset;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const asset = await this.assetRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const linkedWorkOrders = await this.workOrderRepository.count({
      where: { asset_id: id, tenant_id: tenantId, is_deleted: false },
    });

    const childAssets = await this.assetRepository.count({
      where: { parent_asset_id: id, tenant_id: tenantId, is_deleted: false },
    });

    if (linkedWorkOrders > 0 || childAssets > 0) {
      throw new BadRequestException('Asset cannot be deleted because it is currently linked to active service records or child assets.');
    }

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
