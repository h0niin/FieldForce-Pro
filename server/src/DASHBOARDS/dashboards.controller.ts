import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto } from './dto/dashboards_create.dto';
import { UpdateDashboardDto } from './dto/dashboards_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('stats')
  @Permissions('dashboards:read')
  @ApiOperation({ summary: 'Get cached dashboard KPIs and stats' })
  async getStats(@TenantId() tenantId: string) {
    const stats = await this.dashboardsService.getStats(tenantId);
    return DataResponseDto.success(stats, 'Stats fetched successfully');
  }

  @Get('activity-feed')
  @Permissions('dashboards:read')
  @ApiOperation({ summary: 'Get recent activity feed for dashboard' })
  async getActivityFeed(@TenantId() tenantId: string) {
    const feed = await this.dashboardsService.getActivityFeed(tenantId);
    return DataResponseDto.success(feed, 'Activity feed fetched successfully');
  }

  @Get('priority-summary')
  @Permissions('dashboards:read')
  @ApiOperation({ summary: 'Get breakdown of requests by priority' })
  async getPrioritySummary(@TenantId() tenantId: string) {
    const summary = await this.dashboardsService.getPrioritySummary(tenantId);
    return DataResponseDto.success(summary, 'Priority summary fetched successfully');
  }

  @Get()
  @Permissions('dashboards:read')
  @ApiOperation({ summary: 'Get all dashboards (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.dashboardsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Dashboards fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('user/:userId')
  @Permissions('dashboards:read')
  @ApiOperation({ summary: 'Get dashboards by user ID' })
  async findByUserId(
    @Param('userId') userId: string,
    @TenantId() tenantId: string,
  ) {
    const dashboards = await this.dashboardsService.findByUserId(userId, tenantId);
    return DataResponseDto.success(dashboards, 'User dashboards fetched successfully');
  }

  @Get(':id')
  @Permissions('dashboards:read')
  @ApiOperation({ summary: 'Get dashboard by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const dashboard = await this.dashboardsService.findById(id, tenantId);
    return DataResponseDto.success(dashboard);
  }

  @Post()
  @Permissions('dashboards:create')
  @ApiOperation({ summary: 'Create a new dashboard' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateDashboardDto) {
    const dashboard = await this.dashboardsService.create(tenantId, dto);
    return DataResponseDto.created(dashboard, 'Dashboard created successfully');
  }

  @Put(':id')
  @Permissions('dashboards:update')
  @ApiOperation({ summary: 'Update a dashboard' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateDashboardDto,
  ) {
    const dashboard = await this.dashboardsService.update(id, tenantId, dto);
    return DataResponseDto.success(dashboard, 'Dashboard updated successfully');
  }

  @Delete(':id')
  @Permissions('dashboards:delete')
  @ApiOperation({ summary: 'Delete a dashboard (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.dashboardsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Dashboard deleted successfully');
  }
}
