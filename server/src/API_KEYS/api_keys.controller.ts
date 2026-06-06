import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiKeysService } from './api_keys.service';
import { CreateApiKeyDto } from './dto/create_api_key.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'List all API keys for this tenant (hash never returned)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.apiKeysService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'API keys fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get(':id')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get a single API key by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const apiKey = await this.apiKeysService.findById(id, tenantId);
    return DataResponseDto.success(apiKey);
  }

  @Post()
  @Permissions('settings:read')
  @ApiOperation({
    summary: 'Create a new API key — raw key returned ONCE, store it immediately',
  })
  async create(@TenantId() tenantId: string, @Body() dto: CreateApiKeyDto) {
    const { apiKey, raw_key } = await this.apiKeysService.create(tenantId, dto);
    return DataResponseDto.created(
      { ...apiKey.toJSON(), raw_key },
      'API key created. Copy the raw_key now — it will not be shown again.',
    );
  }

  @Patch(':id/revoke')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Revoke (deactivate) an API key' })
  async revoke(@Param('id') id: string, @TenantId() tenantId: string) {
    const apiKey = await this.apiKeysService.revoke(id, tenantId);
    return DataResponseDto.success(apiKey, 'API key revoked successfully');
  }

  @Delete(':id')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Soft-delete an API key' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.apiKeysService.delete(id, tenantId);
    return DataResponseDto.success(null, 'API key deleted successfully');
  }
}
