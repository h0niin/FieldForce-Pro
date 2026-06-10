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
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from '../shared/decorator/public.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/invoices_create.dto';
import { UpdateInvoiceDto } from './dto/invoices_update.dto';
import { UpdateInvoiceStatusDto } from './dto/invoices_update_status.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { InvoiceQueryDto } from './dto/invoices_query.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { PdfService } from '../shared/services/pdf.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) { }

  @Get()
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all invoices (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: InvoiceQueryDto) {
    const result = await this.invoicesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Invoices fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all invoices (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const invoices = await this.invoicesService.findAll(tenantId);
    return DataResponseDto.success(invoices, 'Invoices fetched successfully');
  }

  @Get('work-order/:workOrderId')
  @Permissions('invoices:read', 'scheduling:read')
  @ApiOperation({ summary: 'Get all invoices for a specific work order' })
  async findByWorkOrderId(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const invoices = await this.invoicesService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(invoices, 'Invoices fetched successfully');
  }

  @Get(':id')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const invoice = await this.invoicesService.findById(id, tenantId);
    return DataResponseDto.success(invoice);
  }

  @Post()
  @Permissions('invoices:create', 'scheduling:update')
  @ApiOperation({ summary: 'Create a new invoice' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateInvoiceDto) {
    const invoice = await this.invoicesService.create(tenantId, dto);
    return DataResponseDto.created(invoice, 'Invoice created successfully');
  }

  @Put(':id')
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Update an invoice' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    const invoice = await this.invoicesService.update(id, tenantId, dto);
    return DataResponseDto.success(invoice, 'Invoice updated successfully');
  }

  @Patch(':id/status')
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Update invoice status with transition validation' })
  async updateStatus(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    const invoice = await this.invoicesService.updateStatus(id, tenantId, dto.status);
    return DataResponseDto.success(invoice, 'Invoice status updated successfully');
  }

  @Post(':id/signature')
  @Permissions('invoices:update', 'scheduling:update')
  @ApiOperation({ summary: 'Record the customer digital signature on an invoice' })
  async recordSignature(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('signature_url') signatureUrl: string,
    @Body('signed_by_name') signedByName?: string,
  ) {
    if (!signatureUrl?.trim()) {
      throw new BadRequestException('signature_url is required');
    }
    const invoice = await this.invoicesService.recordSignature(id, tenantId, signatureUrl, signedByName);
    return DataResponseDto.success(invoice, 'Signature recorded successfully');
  }

  @Post(':id/submit-for-approval')
  @Permissions('invoices:update', 'scheduling:update')
  @ApiOperation({ summary: 'Submit a draft invoice into the multi-step approval chain' })
  async submitForApproval(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ) {
    const invoice = await this.invoicesService.submitForApproval(id, tenantId, userId);
    return DataResponseDto.success(invoice, 'Invoice submitted for approval');
  }

  @Delete(':id')
  @Permissions('invoices:delete')
  @ApiOperation({ summary: 'Delete an invoice (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.invoicesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Invoice deleted successfully');
  }

  // ── Customer portal endpoints ────────────────────────────────────────────

  @Post(':id/generate-portal-link')
  @Permissions('invoices:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a shareable public link for customer to view invoice' })
  async generatePortalLink(@Param('id') id: string, @TenantId() tenantId: string) {
    const invoice = await this.invoicesService.generatePublicToken(id, tenantId);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return DataResponseDto.success(
      { portal_url: `${frontendUrl}/invoice/view/${invoice.public_token}`, public_token: invoice.public_token },
      'Portal link generated',
    );
  }

  @Public()
  @Get('public/:token')
  @ApiOperation({ summary: 'Get invoice details by public token (no auth — customer portal)' })
  async getByPublicToken(@Param('token') token: string) {
    const invoice = await this.invoicesService.getByPublicToken(token);
    return DataResponseDto.success(invoice);
  }

  @Get(':id/pdf')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  async downloadPDF(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const html = await this.pdfService.generateInvoicePDF(id, tenantId);

    // For now, return HTML with proper content type
    // TODO: Convert to actual PDF when Puppeteer is integrated
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.html"`);
    res.send(html);
  }
}
