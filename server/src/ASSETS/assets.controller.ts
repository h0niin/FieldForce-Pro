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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/assets_create.dto';
import { UpdateAssetDto } from './dto/assets_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assets (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.assetsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Assets fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all assets (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const assets = await this.assetsService.findAll(tenantId);
    return DataResponseDto.success(assets, 'Assets fetched successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const asset = await this.assetsService.findById(id, tenantId);
    return DataResponseDto.success(asset);
  }

  @Post()
  @Permissions('assets:create')
  @ApiOperation({ summary: 'Create a new asset' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateAssetDto) {
    const asset = await this.assetsService.create(tenantId, dto);
    return DataResponseDto.created(asset, 'Asset created successfully');
  }

  @Put(':id')
  @Permissions('assets:update')
  @ApiOperation({ summary: 'Update an asset' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    const asset = await this.assetsService.update(id, tenantId, dto);
    return DataResponseDto.success(asset, 'Asset updated successfully');
  }

  @Get(':id/work-orders')
  @ApiOperation({ summary: 'Get service history (work orders) for an asset' })
  async getServiceHistory(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.assetsService.findServiceHistory(id, tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Service history fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Delete(':id')
  @Permissions('assets:delete')
  @ApiOperation({ summary: 'Delete an asset (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.assetsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Asset deleted successfully');
  }
}
