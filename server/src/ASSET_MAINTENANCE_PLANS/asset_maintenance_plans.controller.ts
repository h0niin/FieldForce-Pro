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
import { AssetMaintenancePlansService } from './asset_maintenance_plans.service';
import { CreateAssetMaintenancePlanDto } from './dto/asset_maintenance_plans_create.dto';
import { UpdateAssetMaintenancePlanDto } from './dto/asset_maintenance_plans_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Asset Maintenance Plans')
@ApiBearerAuth()
@Controller('asset-maintenance-plans')
export class AssetMaintenancePlansController {
  constructor(private readonly maintenancePlansService: AssetMaintenancePlansService) {}

  @Get()
  @Permissions('assets:read')
  @ApiOperation({ summary: 'Get all maintenance plans (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.maintenancePlansService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Maintenance plans fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('asset/:assetId')
  @Permissions('assets:read')
  @ApiOperation({ summary: 'Get maintenance plans for a specific asset' })
  async findByAsset(@Param('assetId') assetId: string, @TenantId() tenantId: string) {
    const plans = await this.maintenancePlansService.findByAssetId(assetId, tenantId);
    return DataResponseDto.success(plans, 'Maintenance plans fetched successfully');
  }

  @Get(':id')
  @Permissions('assets:read')
  @ApiOperation({ summary: 'Get maintenance plan by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const plan = await this.maintenancePlansService.findById(id, tenantId);
    return DataResponseDto.success(plan);
  }

  @Post()
  @Permissions('assets:create')
  @ApiOperation({ summary: 'Create a new maintenance plan' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateAssetMaintenancePlanDto) {
    const plan = await this.maintenancePlansService.create(tenantId, dto);
    return DataResponseDto.created(plan, 'Maintenance plan created successfully');
  }

  @Put(':id')
  @Permissions('assets:update')
  @ApiOperation({ summary: 'Update a maintenance plan' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateAssetMaintenancePlanDto,
  ) {
    const plan = await this.maintenancePlansService.update(id, tenantId, dto);
    return DataResponseDto.success(plan, 'Maintenance plan updated successfully');
  }

  @Delete(':id')
  @Permissions('assets:delete')
  @ApiOperation({ summary: 'Delete a maintenance plan (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.maintenancePlansService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Maintenance plan deleted successfully');
  }
}
