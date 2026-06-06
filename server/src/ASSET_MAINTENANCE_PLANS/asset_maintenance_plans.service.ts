import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { AssetMaintenancePlan } from './asset_maintenance_plans.entity';
import { CreateAssetMaintenancePlanDto } from './dto/asset_maintenance_plans_create.dto';
import { UpdateAssetMaintenancePlanDto } from './dto/asset_maintenance_plans_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Asset } from '../ASSETS/assets.entity';
import { Op } from 'sequelize';

@Injectable()
export class AssetMaintenancePlansService {
  constructor(
    @Inject(KEYNAMES.ASSET_MAINTENANCE_PLANS)
    private readonly maintenancePlanRepository: typeof AssetMaintenancePlan,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AssetMaintenancePlan>> {
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

    const { count, rows } = await this.maintenancePlanRepository.findAndCountAll({
      where,
      include: [
        { model: Asset, attributes: ['id', 'name', 'serial_number'] },
      ],
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findByAssetId(assetId: string, tenantId: string): Promise<AssetMaintenancePlan[]> {
    return this.maintenancePlanRepository.findAll({
      where: { asset_id: assetId, tenant_id: tenantId, is_deleted: false },
      order: [['next_due_date', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<AssetMaintenancePlan> {
    const plan = await this.maintenancePlanRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: Asset, attributes: ['id', 'name', 'serial_number', 'manufacturer'] },
      ],
    });
    if (!plan) {
      throw new NotFoundException('Maintenance plan not found');
    }
    return plan;
  }

  async create(tenantId: string, dto: CreateAssetMaintenancePlanDto): Promise<AssetMaintenancePlan> {
    return this.maintenancePlanRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAssetMaintenancePlanDto,
  ): Promise<AssetMaintenancePlan> {
    const plan = await this.findById(id, tenantId);
    await plan.update(dto);
    return plan;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const plan = await this.findById(id, tenantId);
    await plan.update({ is_deleted: true });
  }
}
