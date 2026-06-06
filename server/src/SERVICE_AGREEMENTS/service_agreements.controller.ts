import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceAgreementsService } from './service_agreements.service';
import { CreateServiceAgreementDto } from './dto/service_agreements_create.dto';
import { UpdateServiceAgreementDto } from './dto/service_agreements_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Service Agreements')
@ApiBearerAuth()
@Controller('service-agreements')
export class ServiceAgreementsController {
  constructor(private readonly serviceAgreementsService: ServiceAgreementsService) {}

  @Get()
  @Permissions('service_agreements:read')
  @ApiOperation({ summary: 'Get all service agreements (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.serviceAgreementsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Service agreements fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('service_agreements:read')
  @ApiOperation({ summary: 'Get all service agreements (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const agreements = await this.serviceAgreementsService.findAll(tenantId);
    return DataResponseDto.success(agreements, 'Service agreements fetched successfully');
  }

  @Get(':id')
  @Permissions('service_agreements:read')
  @ApiOperation({ summary: 'Get service agreement by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const agreement = await this.serviceAgreementsService.findById(id, tenantId);
    return DataResponseDto.success(agreement);
  }

  @Post()
  @Permissions('service_agreements:create')
  @ApiOperation({ summary: 'Create a new service agreement' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateServiceAgreementDto) {
    const agreement = await this.serviceAgreementsService.create(tenantId, dto);
    return DataResponseDto.created(agreement, 'Service agreement created successfully');
  }

  @Put(':id')
  @Permissions('service_agreements:update')
  @ApiOperation({ summary: 'Update a service agreement' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateServiceAgreementDto,
  ) {
    const agreement = await this.serviceAgreementsService.update(id, tenantId, dto);
    return DataResponseDto.success(agreement, 'Service agreement updated successfully');
  }

  @Patch(':id/status')
  @Permissions('service_agreements:update')
  @ApiOperation({ summary: 'Update service agreement status with transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('status') status: string,
  ) {
    const agreement = await this.serviceAgreementsService.updateStatus(id, tenantId, status);
    return DataResponseDto.success(agreement, 'Service agreement status updated successfully');
  }

  @Patch(':id/renew')
  @Permissions('service_agreements:update')
  @ApiOperation({ summary: 'Renew a service agreement' })
  async renew(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const agreement = await this.serviceAgreementsService.renew(id, tenantId);
    return DataResponseDto.success(agreement, 'Service agreement renewed successfully');
  }

  @Delete(':id')
  @Permissions('service_agreements:delete')
  @ApiOperation({ summary: 'Delete a service agreement (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.serviceAgreementsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Service agreement deleted successfully');
  }
}
