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
import { EstimateLineItemsService } from './estimate_line_items.service';
import { CreateEstimateLineItemDto } from './dto/estimate_line_items_create.dto';
import { UpdateEstimateLineItemDto } from './dto/estimate_line_items_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Estimate Line Items')
@ApiBearerAuth()
@Controller('estimate-line-items')
export class EstimateLineItemsController {
  constructor(private readonly estimateLineItemsService: EstimateLineItemsService) {}

  @Get()
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all estimate line items (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.estimateLineItemsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Estimate line items fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all estimate line items (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const lineItems = await this.estimateLineItemsService.findAll(tenantId);
    return DataResponseDto.success(lineItems, 'Estimate line items fetched successfully');
  }

  @Get('estimate/:estimateId')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get all line items for a specific estimate' })
  async findByEstimateId(
    @Param('estimateId') estimateId: string,
    @TenantId() tenantId: string,
  ) {
    const lineItems = await this.estimateLineItemsService.findByEstimateId(estimateId, tenantId);
    return DataResponseDto.success(lineItems, 'Estimate line items fetched successfully');
  }

  @Get(':id')
  @Permissions('estimates:read')
  @ApiOperation({ summary: 'Get estimate line item by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const lineItem = await this.estimateLineItemsService.findById(id, tenantId);
    return DataResponseDto.success(lineItem);
  }

  @Post()
  @Permissions('estimates:create')
  @ApiOperation({ summary: 'Create a new estimate line item' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateEstimateLineItemDto) {
    const lineItem = await this.estimateLineItemsService.create(tenantId, dto);
    return DataResponseDto.created(lineItem, 'Estimate line item created successfully');
  }

  @Put(':id')
  @Permissions('estimates:update')
  @ApiOperation({ summary: 'Update an estimate line item' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateEstimateLineItemDto,
  ) {
    const lineItem = await this.estimateLineItemsService.update(id, tenantId, dto);
    return DataResponseDto.success(lineItem, 'Estimate line item updated successfully');
  }

  @Delete(':id')
  @Permissions('estimates:delete')
  @ApiOperation({ summary: 'Delete an estimate line item (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.estimateLineItemsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Estimate line item deleted successfully');
  }
}
