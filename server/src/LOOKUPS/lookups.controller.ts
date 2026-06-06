import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LookupsService } from './lookups.service';
import { TenantId } from '../shared/decorator/tenant.decorator';

@ApiTags('Lookups')
@ApiBearerAuth()
@Controller('lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories for lookups' })
  async getCategories(@TenantId() tenantId: string) {
    return this.lookupsService.getCategories(tenantId);
  }

  @Get('sub-categories')
  @ApiOperation({ summary: 'Get all sub-categories for lookups' })
  async getSubCategories(@TenantId() tenantId: string, @Query('category_id') categoryId?: string) {
    return this.lookupsService.getSubCategories(tenantId, categoryId);
  }

  @Get('priorities')
  @ApiOperation({ summary: 'Get all priorities for lookups' })
  async getPriorities(@TenantId() tenantId: string) {
    return this.lookupsService.getPriorities(tenantId);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations for lookups' })
  async getLocations(@TenantId() tenantId: string) {
    return this.lookupsService.getLocations(tenantId);
  }
}
