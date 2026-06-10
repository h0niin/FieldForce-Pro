import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/assets_create.dto';
import { UpdateAssetDto } from './dto/assets_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';

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
  async create(@TenantId() tenantId: string, @Body() dto: CreateAssetDto, @CurrentUser('id') userId: string) {
    const asset = await this.assetsService.create(tenantId, dto, userId);
    return DataResponseDto.created(asset, 'Asset created successfully');
  }

  @Put(':id')
  @Permissions('assets:update')
  @ApiOperation({ summary: 'Update an asset' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser('id') userId: string,
  ) {
    const asset = await this.assetsService.update(id, tenantId, dto, userId);
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

  @Post('import')
  @Permissions('assets:create')
  @ApiOperation({ summary: 'Import assets from CSV' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importCsv(
    @UploadedFile() file: any,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.assetsService.importCsv(file.buffer, tenantId, userId);
    return DataResponseDto.success(result, 'Assets imported successfully');
  }

  @Post('export/csv')
  @Permissions('assets:read')
  @ApiOperation({ summary: 'Export assets to CSV' })
  async exportCsv(@TenantId() tenantId: string, @Res() res: Response, @Body() body?: { recordIds?: string[] }) {
    const csvData = await this.assetsService.exportCsv(tenantId, body?.recordIds);
    res.header('Content-Type', 'text/csv');
    res.attachment('assets.csv');
    return res.send(csvData);
  }

  @Put('bulk/change-owner')
  @Permissions('assets:update')
  @ApiOperation({ summary: 'Bulk change owner of assets' })
  async changeOwner(
    @Body() body: { recordIds: string[]; newOwnerId: string },
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.assetsService.changeOwner(body.recordIds, body.newOwnerId, tenantId, userId);
    return DataResponseDto.success(null, 'Owner changed successfully');
  }

  @Post(':id/clone')
  @Permissions('assets:create')
  @ApiOperation({ summary: 'Clone an existing asset' })
  async cloneAsset(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const asset = await this.assetsService.cloneAsset(id, tenantId, userId);
    return DataResponseDto.created(asset, 'Asset cloned successfully');
  }
}
