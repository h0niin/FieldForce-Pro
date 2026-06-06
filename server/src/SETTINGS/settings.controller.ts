import {
  Controller,
  Get,
  Put,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/settings_upsert.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get all settings for tenant' })
  async findAll(@TenantId() tenantId: string) {
    const settings = await this.settingsService.findAll(tenantId);
    return DataResponseDto.success(settings, 'Settings fetched successfully');
  }

  @Get('category/:category')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get settings by category' })
  async findByCategory(
    @Param('category') category: string,
    @TenantId() tenantId: string,
  ) {
    const settings = await this.settingsService.findByCategory(category, tenantId);
    return DataResponseDto.success(settings, 'Settings fetched successfully');
  }

  @Get(':key')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get setting by key' })
  async findByKey(@Param('key') key: string, @TenantId() tenantId: string) {
    const setting = await this.settingsService.findByKey(key, tenantId);
    return DataResponseDto.success(setting);
  }

  @Put(':key')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Upsert a setting by key' })
  async upsert(
    @Param('key') key: string,
    @TenantId() tenantId: string,
    @Body() dto: UpsertSettingDto,
  ) {
    const setting = await this.settingsService.upsert(key, tenantId, dto);
    return DataResponseDto.success(setting, 'Setting saved successfully');
  }
}
