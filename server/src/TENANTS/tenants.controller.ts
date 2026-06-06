import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenants.dto';
import { UpdatePaymentSettingsDto } from './dto/payment_settings.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ── Payment settings for the current tenant (Step 12) ──
  // Placed before ':id' routes so 'me' is not captured as an :id param.
  @Get('me/payment-settings')
  @ApiOperation({ summary: "Get the current tenant's payment config (UPI / bank / QR)" })
  async getPaymentSettings(@TenantId() tenantId: string) {
    const config = await this.tenantsService.getPaymentSettings(tenantId);
    return DataResponseDto.success(config);
  }

  @Put('me/payment-settings')
  @ApiOperation({ summary: "Update the current tenant's payment config" })
  async updatePaymentSettings(
    @TenantId() tenantId: string,
    @Body() dto: UpdatePaymentSettingsDto,
  ) {
    const config = await this.tenantsService.updatePaymentSettings(tenantId, { ...dto });
    return DataResponseDto.success(config, 'Payment settings updated successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantsService.create(dto);
    return DataResponseDto.created(tenant, 'Tenant created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  async findAll() {
    const tenants = await this.tenantsService.findAll();
    return DataResponseDto.success(tenants);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantsService.findById(id);
    return DataResponseDto.success(tenant);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantsService.update(id, dto);
    return DataResponseDto.success(tenant, 'Tenant updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a tenant' })
  async remove(@Param('id') id: string) {
    await this.tenantsService.remove(id);
    return DataResponseDto.success(null, 'Tenant deactivated successfully');
  }
}
