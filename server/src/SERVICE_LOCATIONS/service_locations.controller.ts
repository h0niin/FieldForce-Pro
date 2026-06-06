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
import { ServiceLocationsService } from './service_locations.service';
import { CreateServiceLocationDto } from './dto/service_locations_create.dto';
import { UpdateServiceLocationDto } from './dto/service_locations_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Service Locations')
@ApiBearerAuth()
@Controller('service-locations')
export class ServiceLocationsController {
  constructor(private readonly serviceLocationsService: ServiceLocationsService) { }

  @Get()
  @Permissions('service_locations:read')
  @ApiOperation({ summary: 'Get all service locations (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.serviceLocationsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Service locations fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('service_locations:read')
  @ApiOperation({ summary: 'Get all service locations (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const serviceLocations = await this.serviceLocationsService.findAll(tenantId);
    return DataResponseDto.success(serviceLocations, 'Service locations fetched successfully');
  }

  @Get('by-contact/:contactId')
  @Permissions('service_locations:read')
  @ApiOperation({ summary: 'Get service locations by contact ID' })
  async findByContact(@Param('contactId') contactId: string, @TenantId() tenantId: string) {
    const serviceLocations = await this.serviceLocationsService.findByContact(contactId, tenantId);
    return DataResponseDto.success(serviceLocations, 'Service locations fetched successfully');
  }

  @Get('by-company/:companyId')
  @Permissions('service_locations:read')
  @ApiOperation({ summary: 'Get service locations by company ID' })
  async findByCompany(@Param('companyId') companyId: string, @TenantId() tenantId: string) {
    const serviceLocations = await this.serviceLocationsService.findByCompany(companyId, tenantId);
    return DataResponseDto.success(serviceLocations, 'Service locations fetched successfully');
  }

  @Get(':id')
  @Permissions('service_locations:read')
  @ApiOperation({ summary: 'Get service location by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const serviceLocation = await this.serviceLocationsService.findById(id, tenantId);
    return DataResponseDto.success(serviceLocation);
  }

  @Post()
  @Permissions('service_locations:create')
  @ApiOperation({ summary: 'Create a new service location' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateServiceLocationDto) {
    const serviceLocation = await this.serviceLocationsService.create(tenantId, dto);
    return DataResponseDto.created(serviceLocation, 'Service location created successfully');
  }

  @Put(':id')
  @Permissions('service_locations:update')
  @ApiOperation({ summary: 'Update a service location' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateServiceLocationDto,
  ) {
    const serviceLocation = await this.serviceLocationsService.update(id, tenantId, dto);
    return DataResponseDto.success(serviceLocation, 'Service location updated successfully');
  }

  @Delete(':id')
  @Permissions('service_locations:delete')
  @ApiOperation({ summary: 'Delete a service location (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.serviceLocationsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Service location deleted successfully');
  }
}
