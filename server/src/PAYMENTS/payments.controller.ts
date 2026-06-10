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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '../shared/decorator/public.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payments_create.dto';
import { UpdatePaymentDto } from './dto/payments_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

import { StripeService } from '../shared/services/stripe.service';
import { RazorpayService } from '../shared/services/razorpay.service';
import { AppConfigService } from '../shared/config/config.service';
import { TenantsService } from '../TENANTS/tenants.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly razorpayService: RazorpayService,
    private readonly configService: AppConfigService,
    private readonly tenantsService: TenantsService,
  ) { }

  @Post('stripe/connection-token')
  @Permissions('payments:create')
  @ApiOperation({ summary: 'Create a Stripe Terminal connection token' })
  async createConnectionToken() {
    const token = await this.stripeService.createConnectionToken();
    return DataResponseDto.success(token);
  }

  @Post('stripe/create-intent')
  @Permissions('payments:create')
  @ApiOperation({ summary: 'Create a Stripe Payment Intent for Terminal' })
  async createPaymentIntent(
    @Body() dto: { amount: number; currency?: string; metadata?: Record<string, string> },
  ) {
    const intent = await this.stripeService.createPaymentIntent(
      dto.amount,
      dto.currency || 'usd',
      dto.metadata || {},
    );
    return DataResponseDto.success(intent);
  }

  @Get('upi/config')
  @Permissions('payments:create', 'scheduling:update')
  @ApiOperation({ summary: 'Get UPI merchant config for QR code payment' })
  async getUpiConfig(@TenantId() tenantId: string) {
    let vpa = this.configService.upiMerchantVpa;
    let name = this.configService.upiMerchantName;

    try {
      const settings = await this.tenantsService.getPaymentSettings(tenantId);
      if (settings && settings.upi_vpa) {
        vpa = settings.upi_vpa as string;
        name = (settings.upi_name as string) || name;
      }
    } catch (err) {
      // Ignore and fallback to config values
    }

    if (!vpa) {
      return DataResponseDto.success({ configured: false });
    }
    return DataResponseDto.success({ configured: true, vpa, name });
  }

  @Post('razorpay/create-order')
  @Permissions('payments:create', 'scheduling:update')
  @ApiOperation({ summary: 'Create a Razorpay order for checkout' })
  async createRazorpayOrder(
    @Body() dto: { amount: number; currency?: string; invoice_id?: string; appointment_id?: string },
  ) {
    const order = await this.razorpayService.createOrder(
      dto.amount,
      dto.currency || 'INR',
      dto.invoice_id ? `inv_${dto.invoice_id}` : undefined,
      {
        ...(dto.invoice_id ? { invoice_id: dto.invoice_id } : {}),
        ...(dto.appointment_id ? { appointment_id: dto.appointment_id } : {}),
      },
    );
    return DataResponseDto.success({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: this.configService.razorpayMode === 'mock' ? 'rzp_mock_test' : this.configService.razorpayKeyId,
      mock: this.configService.razorpayMode === 'mock',
    });
  }

  @Post('razorpay/verify')
  @Permissions('payments:create', 'scheduling:update')
  @ApiOperation({ summary: 'Verify Razorpay payment signature and record payment' })
  async verifyRazorpayPayment(
    @TenantId() tenantId: string,
    @Body()
    dto: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      invoice_id: string;
      amount: number;
    },
  ) {
    const isValid = this.razorpayService.verifyPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature,
    );
    if (!isValid) {
      return DataResponseDto.error('Invalid payment signature');
    }
    const payment = await this.paymentsService.create(tenantId, {
      invoice_id: dto.invoice_id,
      amount: dto.amount,
      method: 'online',
      gateway_transaction_id: dto.razorpay_payment_id,
      status: 'completed',
      paid_at: new Date().toISOString(),
      notes: 'Payment collected via Razorpay',
    });
    return DataResponseDto.success(payment, 'Payment verified and recorded successfully');
  }

  @Get()
  @Permissions('payments:read')
  @ApiOperation({ summary: 'Get all payments (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.paymentsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Payments fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('payments:read')
  @ApiOperation({ summary: 'Get all payments (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const payments = await this.paymentsService.findAll(tenantId);
    return DataResponseDto.success(payments, 'Payments fetched successfully');
  }

  @Get('invoice/:invoiceId')
  @Permissions('payments:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all payments for a specific invoice' })
  async findByInvoiceId(
    @Param('invoiceId') invoiceId: string,
    @TenantId() tenantId: string,
  ) {
    const payments = await this.paymentsService.findByInvoiceId(invoiceId, tenantId);
    return DataResponseDto.success(payments, 'Payments fetched successfully');
  }

  // ── Pending verification endpoints ───────────────────────────────────────

  @Get('pending-verification')
  @Permissions('payments:read')
  @ApiOperation({ summary: 'Get payments pending dispatcher verification' })
  async getPendingVerification(@TenantId() tenantId: string) {
    const payments = await this.paymentsService.getPendingVerification(tenantId);
    return DataResponseDto.success(payments);
  }

  @Public()
  @Post('portal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Customer submits payment notification from portal (no auth)' })
  async createFromPortal(@Body() body: {
    invoice_token: string;
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    screenshot_url?: string;
  }) {
    const payment = await this.paymentsService.createFromPortal(body.invoice_token, {
      amount: body.amount,
      method: body.method,
      reference: body.reference,
      notes: body.notes,
      screenshot_url: body.screenshot_url,
    });
    return DataResponseDto.created(payment, 'Payment submitted for verification');
  }
  @Get(':id')
  @Permissions('payments:read')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const payment = await this.paymentsService.findById(id, tenantId);
    return DataResponseDto.success(payment);
  }


  @Patch(':id/confirm')
  @Permissions('payments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatcher confirms a portal payment' })
  async confirmPayment(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    const payment = await this.paymentsService.confirmPayment(id, tenantId);
    return DataResponseDto.success(payment, 'Payment confirmed');
  }

  @Patch(':id/reject')
  @Permissions('payments:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatcher rejects a portal payment' })
  async rejectPayment(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() body: { reason: string },
  ) {
    const payment = await this.paymentsService.rejectPayment(id, tenantId, body.reason || '');
    return DataResponseDto.success(payment, 'Payment rejected');
  }

  @Post()
  @Permissions('payments:create', 'scheduling:update')
  @ApiOperation({ summary: 'Create a new payment' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: { id: string; email?: string; primary_role?: string },
  ) {
    const receivedBy = user?.email || user?.id || 'Staff';
    const payment = await this.paymentsService.create(tenantId, { ...dto, received_by: receivedBy });
    return DataResponseDto.created(payment, 'Payment created successfully');
  }

  @Put(':id')
  @Permissions('payments:update')
  @ApiOperation({ summary: 'Update a payment' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    const payment = await this.paymentsService.update(id, tenantId, dto);
    return DataResponseDto.success(payment, 'Payment updated successfully');
  }

  @Delete(':id')
  @Permissions('payments:delete')
  @ApiOperation({ summary: 'Delete a payment (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.paymentsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Payment deleted successfully');
  }
}
