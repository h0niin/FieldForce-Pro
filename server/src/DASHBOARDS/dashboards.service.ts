import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Dashboard } from './dashboards.entity';
import { RedisCacheService } from '../shared/services/redis-cache.service';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { RequestAuditLog } from '../SERVICE_REQUESTS/request_audit_log.entity';
import { CreateDashboardDto } from './dto/dashboards_create.dto';
import { UpdateDashboardDto } from './dto/dashboards_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';

@Injectable()
export class DashboardsService {
  constructor(
    @Inject(KEYNAMES.DASHBOARDS)
    private readonly dashboardRepository: typeof Dashboard,
    @Inject(KEYNAMES.SERVICE_REQUESTS)
    private readonly requestRepository: typeof ServiceRequest,
    @Inject(KEYNAMES.REQUEST_AUDIT_LOGS)
    private readonly auditLogRepository: typeof RequestAuditLog,
    private readonly redisCache: RedisCacheService,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Dashboard>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.dashboardRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findById(id: string, tenantId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }
    return dashboard;
  }

  async findByUserId(userId: string, tenantId: string): Promise<Dashboard[]> {
    return this.dashboardRepository.findAll({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: false },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    });
  }

  async create(tenantId: string, dto: CreateDashboardDto): Promise<Dashboard> {
    return this.dashboardRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    const dashboard = await this.findById(id, tenantId);
    await dashboard.update(dto);
    return dashboard;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const dashboard = await this.findById(id, tenantId);
    await dashboard.update({ is_deleted: true });
  }

  async getStats(tenantId: string) {
    const cacheKey = `dashboard:stats:${tenantId}`;
    const cachedStats = await this.redisCache.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }

    const openRequests = await this.requestRepository.count({
      where: { tenant_id: tenantId, status: { [Op.notIn]: ['closed', 'rejected', 'spam'] } },
    });
    const unassignedRequests = await this.requestRepository.count({
      where: { tenant_id: tenantId, assigned_to: null, status: { [Op.notIn]: ['closed', 'rejected', 'spam'] } },
    });
    const criticalRequests = await this.requestRepository.count({
      where: { tenant_id: tenantId, priority: 'CRITICAL', status: { [Op.notIn]: ['closed', 'rejected', 'spam'] } },
    });

    const stats = {
      openRequests,
      unassignedRequests,
      criticalRequests,
      systemHealth: 99.9,
    };

    await this.redisCache.set(cacheKey, stats, 60); // 60 seconds TTL
    return stats;
  }

  async getActivityFeed(tenantId: string) {
    const activities = await this.auditLogRepository.findAll({
      where: { tenant_id: tenantId },
      order: [['changed_at', 'DESC']],
      limit: 10,
    });
    return activities;
  }

  async getPrioritySummary(tenantId: string) {
    const requests = await this.requestRepository.findAll({
      where: { tenant_id: tenantId, status: { [Op.notIn]: ['closed', 'rejected', 'spam'] } },
      attributes: ['priority', [this.requestRepository.sequelize!.fn('COUNT', 'priority'), 'count']],
      group: ['priority'],
    });

    return requests.map(r => ({
      priority: r.priority,
      count: parseInt(r.getDataValue('count') as unknown as string, 10) || 0,
    }));
  }
}
