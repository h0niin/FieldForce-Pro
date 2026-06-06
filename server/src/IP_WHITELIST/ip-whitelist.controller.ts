import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { IPWhitelistService, CreateIPWhitelistDto, UpdateIPWhitelistDto } from './ip-whitelist.service';

@ApiTags('IP Whitelist')
@Controller('ip-whitelist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IPWhitelistController {
  constructor(private readonly ipWhitelistService: IPWhitelistService) {}

  @Get('config')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get IP whitelist configuration' })
  async getConfig(@TenantId() tenantId: string) {
    const config = await this.ipWhitelistService.getConfig(tenantId);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'IP whitelist config retrieved successfully',
      data: config,
    });
  }

  @Put('toggle')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Enable or disable IP whitelisting' })
  async toggle(
    @TenantId() tenantId: string,
    @Body() body: { enabled: boolean },
  ) {
    await this.ipWhitelistService.setEnabled(tenantId, body.enabled);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: `IP whitelisting ${body.enabled ? 'enabled' : 'disabled'} successfully`,
      data: { enabled: body.enabled },
    });
  }

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get all whitelisted IPs' })
  async findAll(@TenantId() tenantId: string) {
    const entries = await this.ipWhitelistService.findAll(tenantId);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'IP whitelist retrieved successfully',
      data: entries,
    });
  }

  @Post()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Add IP to whitelist' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateIPWhitelistDto,
  ) {
    const entry = await this.ipWhitelistService.create(tenantId, dto);

    return new DataResponseDto({
      statusCode: HttpStatus.CREATED,
      status: true,
      message: 'IP added to whitelist successfully',
      data: entry,
    });
  }

  @Put(':id')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update IP whitelist entry' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateIPWhitelistDto,
  ) {
    const entry = await this.ipWhitelistService.update(id, tenantId, dto);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'IP whitelist entry updated successfully',
      data: entry,
    });
  }

  @Delete(':id')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Remove IP from whitelist' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    await this.ipWhitelistService.delete(id, tenantId);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'IP removed from whitelist successfully',
      data: null,
    });
  }
}