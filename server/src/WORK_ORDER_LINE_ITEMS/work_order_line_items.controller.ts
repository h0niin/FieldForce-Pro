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
import { WorkOrderLineItemsService } from './work_order_line_items.service';
import { CreateWorkOrderLineItemDto } from './dto/work_order_line_items_create.dto';
import { UpdateWorkOrderLineItemDto } from './dto/work_order_line_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Work Order Line Items')
@ApiBearerAuth()
@Controller('work-order-line-items')
export class WorkOrderLineItemsController {
  constructor(private readonly workOrderLineItemsService: WorkOrderLineItemsService) {}

  @Get()
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work order line items (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.workOrderLineItemsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Work order line items fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work order line items (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const lineItems = await this.workOrderLineItemsService.findAll(tenantId);
    return DataResponseDto.success(lineItems, 'Work order line items fetched successfully');
  }

  @Get('work-order/:workOrderId')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all line items for a work order' })
  async findByWorkOrderId(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const lineItems = await this.workOrderLineItemsService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(lineItems, 'Work order line items fetched successfully');
  }

  @Get(':id')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work order line item by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const lineItem = await this.workOrderLineItemsService.findById(id, tenantId);
    return DataResponseDto.success(lineItem);
  }

  @Post()
  @Permissions('work_orders:create')
  @ApiOperation({ summary: 'Create a new work order line item' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWorkOrderLineItemDto) {
    const lineItem = await this.workOrderLineItemsService.create(tenantId, dto);
    return DataResponseDto.created(lineItem, 'Work order line item created successfully');
  }

  @Put(':id')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Update a work order line item' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkOrderLineItemDto,
  ) {
    const lineItem = await this.workOrderLineItemsService.update(id, tenantId, dto);
    return DataResponseDto.success(lineItem, 'Work order line item updated successfully');
  }

  @Delete(':id')
  @Permissions('work_orders:delete')
  @ApiOperation({ summary: 'Delete a work order line item (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.workOrderLineItemsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Work order line item deleted successfully');
  }
}
