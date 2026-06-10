import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantModulesService } from './tenant_modules.service';
import { ToggleTenantModuleDto } from './dto/tenant_modules.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Tenant Modules')
@ApiBearerAuth()
@Controller('tenant-modules')
export class TenantModulesController {
  constructor(private readonly tenantModulesService: TenantModulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all modules with enabled/disabled status for this tenant' })
  async findAll(@TenantId() tenantId: string) {
    const modules = await this.tenantModulesService.findAll(tenantId);
    return DataResponseDto.success(modules, 'Modules fetched successfully');
  }

  @Patch(':moduleName')
  @ApiOperation({ summary: 'Toggle a module on or off' })
  async toggle(
    @Param('moduleName') moduleName: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ToggleTenantModuleDto,
  ) {
    const result = await this.tenantModulesService.toggle(tenantId, moduleName, userId, dto);
    return DataResponseDto.success(result, 'Module status updated');
  }
}
