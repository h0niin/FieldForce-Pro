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
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';
import { generateEntityDiff } from '../utils/diff-logger.util';

@Injectable()
export class AssetMaintenancePlansService {
  constructor(
    @Inject(KEYNAMES.ASSET_MAINTENANCE_PLANS)
    private readonly maintenancePlanRepository: typeof AssetMaintenancePlan,
    private readonly activityLogsService: ActivityLogsService,
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
        { model: Asset, attributes: ['id', 'name', 'serial_number', 'manufacturer', 'contact_id', 'company_id'] },
      ],
    });
    if (!plan) {
      throw new NotFoundException('Maintenance plan not found');
    }
    return plan;
  }

  async create(tenantId: string, dto: CreateAssetMaintenancePlanDto): Promise<AssetMaintenancePlan> {
    const plan = await this.maintenancePlanRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
    
    const fullPlan = await this.findById(plan.id, tenantId);
    if (fullPlan.asset) {
      if ((fullPlan.asset as any).contact_id) {
        await this.activityLogsService.logActivity(tenantId, 'Contact', (fullPlan.asset as any).contact_id, 'CREATED', `Maintenance Plan '${plan.name}' was assigned to Asset '${fullPlan.asset.name}'.`).catch(() => {});
      }
      if ((fullPlan.asset as any).company_id) {
        await this.activityLogsService.logActivity(tenantId, 'Company', (fullPlan.asset as any).company_id, 'CREATED', `Maintenance Plan '${plan.name}' was assigned to Asset '${fullPlan.asset.name}'.`).catch(() => {});
      }
    }
    return fullPlan;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAssetMaintenancePlanDto,
  ): Promise<AssetMaintenancePlan> {
    const plan = await this.findById(id, tenantId);
    
    const diffArray = generateEntityDiff(plan, dto);
    const diffString = diffArray.join(', ');
    const description = diffString !== '' ? diffString : 'Maintenance Plan details were updated.';

    await plan.update(dto);

    if (plan.asset && diffString !== '') {
      if ((plan.asset as any).contact_id) {
        await this.activityLogsService.logActivity(tenantId, 'Contact', (plan.asset as any).contact_id, 'UPDATED', `Maintenance Plan '${plan.name}': ${description}`).catch(() => {});
      }
      if ((plan.asset as any).company_id) {
        await this.activityLogsService.logActivity(tenantId, 'Company', (plan.asset as any).company_id, 'UPDATED', `Maintenance Plan '${plan.name}': ${description}`).catch(() => {});
      }
    }

    return plan;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const plan = await this.findById(id, tenantId);
    await plan.update({ is_deleted: true });
  }
}
