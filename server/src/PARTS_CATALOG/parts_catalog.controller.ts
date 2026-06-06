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
import { PartsCatalogService } from './parts_catalog.service';
import { CreatePartsCatalogDto } from './dto/parts_catalog_create.dto';
import { UpdatePartsCatalogDto } from './dto/parts_catalog_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Parts Catalog')
@ApiBearerAuth()
@Controller('parts-catalog')
export class PartsCatalogController {
  constructor(private readonly partsCatalogService: PartsCatalogService) {}

  @Get()
  @Permissions('parts_catalog:read')
  @ApiOperation({ summary: 'Get all parts (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.partsCatalogService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Parts fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('parts_catalog:read')
  @ApiOperation({ summary: 'Get all parts (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const parts = await this.partsCatalogService.findAll(tenantId);
    return DataResponseDto.success(parts, 'Parts fetched successfully');
  }

  @Get(':id')
  @Permissions('parts_catalog:read')
  @ApiOperation({ summary: 'Get part by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const part = await this.partsCatalogService.findById(id, tenantId);
    return DataResponseDto.success(part);
  }

  @Post()
  @Permissions('parts_catalog:create')
  @ApiOperation({ summary: 'Create a new part' })
  async create(@TenantId() tenantId: string, @Body() dto: CreatePartsCatalogDto) {
    const part = await this.partsCatalogService.create(tenantId, dto);
    return DataResponseDto.created(part, 'Part created successfully');
  }

  @Put(':id')
  @Permissions('parts_catalog:update')
  @ApiOperation({ summary: 'Update a part' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdatePartsCatalogDto,
  ) {
    const part = await this.partsCatalogService.update(id, tenantId, dto);
    return DataResponseDto.success(part, 'Part updated successfully');
  }

  @Delete(':id')
  @Permissions('parts_catalog:delete')
  @ApiOperation({ summary: 'Delete a part (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.partsCatalogService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Part deleted successfully');
  }
}
