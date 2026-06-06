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
import { PricebookService } from './pricebook.service';
import { CreatePricebookDto } from './dto/pricebook_create.dto';
import { UpdatePricebookDto } from './dto/pricebook_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Pricebook')
@ApiBearerAuth()
@Controller('pricebook')
export class PricebookController {
  constructor(private readonly pricebookService: PricebookService) {}

  @Get()
  @Permissions('pricebook:read')
  @ApiOperation({ summary: 'Get all pricebook entries (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.pricebookService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Pricebook entries fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('pricebook:read')
  @ApiOperation({ summary: 'Get all pricebook entries (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const entries = await this.pricebookService.findAll(tenantId);
    return DataResponseDto.success(entries, 'Pricebook entries fetched successfully');
  }

  @Get(':id')
  @Permissions('pricebook:read')
  @ApiOperation({ summary: 'Get pricebook entry by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const pricebook = await this.pricebookService.findById(id, tenantId);
    return DataResponseDto.success(pricebook);
  }

  @Post()
  @Permissions('pricebook:create')
  @ApiOperation({ summary: 'Create a new pricebook entry' })
  async create(@TenantId() tenantId: string, @Body() dto: CreatePricebookDto) {
    const pricebook = await this.pricebookService.create(tenantId, dto);
    return DataResponseDto.created(pricebook, 'Pricebook entry created successfully');
  }

  @Put(':id')
  @Permissions('pricebook:update')
  @ApiOperation({ summary: 'Update a pricebook entry' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdatePricebookDto,
  ) {
    const pricebook = await this.pricebookService.update(id, tenantId, dto);
    return DataResponseDto.success(pricebook, 'Pricebook entry updated successfully');
  }

  @Delete(':id')
  @Permissions('pricebook:delete')
  @ApiOperation({ summary: 'Delete a pricebook entry (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.pricebookService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Pricebook entry deleted successfully');
  }
}
