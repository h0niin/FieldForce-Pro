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
import { PaymentGatewaysService } from './payment_gateways.service';
import { CreatePaymentGatewayDto } from './dto/payment_gateways_create.dto';
import { UpdatePaymentGatewayDto } from './dto/payment_gateways_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Payment Gateways')
@ApiBearerAuth()
@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(private readonly paymentGatewaysService: PaymentGatewaysService) {}

  @Get()
  @Permissions('payment_gateways:read')
  @ApiOperation({ summary: 'Get all payment gateways (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.paymentGatewaysService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Payment gateways fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('payment_gateways:read')
  @ApiOperation({ summary: 'Get all payment gateways (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const gateways = await this.paymentGatewaysService.findAll(tenantId);
    return DataResponseDto.success(gateways, 'Payment gateways fetched successfully');
  }

  @Get(':id')
  @Permissions('payment_gateways:read')
  @ApiOperation({ summary: 'Get payment gateway by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const gateway = await this.paymentGatewaysService.findById(id, tenantId);
    return DataResponseDto.success(gateway);
  }

  @Post()
  @Permissions('payment_gateways:create')
  @ApiOperation({ summary: 'Create a new payment gateway' })
  async create(@TenantId() tenantId: string, @Body() dto: CreatePaymentGatewayDto) {
    const gateway = await this.paymentGatewaysService.create(tenantId, dto);
    return DataResponseDto.created(gateway, 'Payment gateway created successfully');
  }

  @Put(':id')
  @Permissions('payment_gateways:update')
  @ApiOperation({ summary: 'Update a payment gateway' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdatePaymentGatewayDto,
  ) {
    const gateway = await this.paymentGatewaysService.update(id, tenantId, dto);
    return DataResponseDto.success(gateway, 'Payment gateway updated successfully');
  }

  @Delete(':id')
  @Permissions('payment_gateways:delete')
  @ApiOperation({ summary: 'Delete a payment gateway (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.paymentGatewaysService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Payment gateway deleted successfully');
  }
}
