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
import { ServicesCatalogService } from './services_catalog.service';
import { CreateServicesCatalogDto } from './dto/services_catalog_create.dto';
import { UpdateServicesCatalogDto } from './dto/services_catalog_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Services Catalog')
@ApiBearerAuth()
@Controller('services-catalog')
export class ServicesCatalogController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Get()
  @Permissions('services_catalog:read')
  @ApiOperation({ summary: 'Get all services (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.servicesCatalogService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Services fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('services_catalog:read')
  @ApiOperation({ summary: 'Get all services (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const services = await this.servicesCatalogService.findAll(tenantId);
    return DataResponseDto.success(services, 'Services fetched successfully');
  }

  @Get(':id')
  @Permissions('services_catalog:read')
  @ApiOperation({ summary: 'Get service by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const service = await this.servicesCatalogService.findById(id, tenantId);
    return DataResponseDto.success(service);
  }

  @Post()
  @Permissions('services_catalog:create')
  @ApiOperation({ summary: 'Create a new service' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateServicesCatalogDto) {
    const service = await this.servicesCatalogService.create(tenantId, dto);
    return DataResponseDto.created(service, 'Service created successfully');
  }

  @Put(':id')
  @Permissions('services_catalog:update')
  @ApiOperation({ summary: 'Update a service' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateServicesCatalogDto,
  ) {
    const service = await this.servicesCatalogService.update(id, tenantId, dto);
    return DataResponseDto.success(service, 'Service updated successfully');
  }

  @Delete(':id')
  @Permissions('services_catalog:delete')
  @ApiOperation({ summary: 'Delete a service (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.servicesCatalogService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Service deleted successfully');
  }
}
