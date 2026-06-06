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
import { InvoiceLineItemsService } from './invoice_line_items.service';
import { CreateInvoiceLineItemDto } from './dto/invoice_line_items_create.dto';
import { UpdateInvoiceLineItemDto } from './dto/invoice_line_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Invoice Line Items')
@ApiBearerAuth()
@Controller('invoice-line-items')
export class InvoiceLineItemsController {
  constructor(private readonly invoiceLineItemsService: InvoiceLineItemsService) {}

  @Get()
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all invoice line items (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.invoiceLineItemsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Invoice line items fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all invoice line items (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const lineItems = await this.invoiceLineItemsService.findAll(tenantId);
    return DataResponseDto.success(lineItems, 'Invoice line items fetched successfully');
  }

  @Get('invoice/:invoiceId')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get all line items for a specific invoice' })
  async findByInvoiceId(
    @Param('invoiceId') invoiceId: string,
    @TenantId() tenantId: string,
  ) {
    const lineItems = await this.invoiceLineItemsService.findByInvoiceId(invoiceId, tenantId);
    return DataResponseDto.success(lineItems, 'Invoice line items fetched successfully');
  }

  @Get(':id')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Get invoice line item by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const lineItem = await this.invoiceLineItemsService.findById(id, tenantId);
    return DataResponseDto.success(lineItem);
  }

  @Post()
  @Permissions('invoices:create')
  @ApiOperation({ summary: 'Create a new invoice line item' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateInvoiceLineItemDto) {
    const lineItem = await this.invoiceLineItemsService.create(tenantId, dto);
    return DataResponseDto.created(lineItem, 'Invoice line item created successfully');
  }

  @Put(':id')
  @Permissions('invoices:update')
  @ApiOperation({ summary: 'Update an invoice line item' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateInvoiceLineItemDto,
  ) {
    const lineItem = await this.invoiceLineItemsService.update(id, tenantId, dto);
    return DataResponseDto.success(lineItem, 'Invoice line item updated successfully');
  }

  @Delete(':id')
  @Permissions('invoices:delete')
  @ApiOperation({ summary: 'Delete an invoice line item (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.invoiceLineItemsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Invoice line item deleted successfully');
  }
}
