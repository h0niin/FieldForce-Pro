import {
  Controller,
  Get,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DispatchConsoleLayoutsService } from './dispatch_console_layouts.service';
import { SaveDispatchConsoleLayoutDto } from './dto/dispatch_console_layouts.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Dispatch Console Layouts')
@ApiBearerAuth()
@Controller('dispatch-console-layouts')
export class DispatchConsoleLayoutsController {
  constructor(private readonly layoutsService: DispatchConsoleLayoutsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all dispatch console layouts config' })
  async getLayouts(@TenantId() tenantId: string) {
    const result = await this.layoutsService.findAll(tenantId);
    return DataResponseDto.success(result, 'Layouts fetched successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Save/update a dispatch console layout view config' })
  async saveLayout(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveDispatchConsoleLayoutDto,
  ) {
    const result = await this.layoutsService.saveLayout(tenantId, userId, dto);
    return DataResponseDto.success(result, 'Layout config updated successfully');
  }
}
