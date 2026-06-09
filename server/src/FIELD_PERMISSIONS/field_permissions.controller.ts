import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FieldPermissionsService } from './field_permissions.service';
import { BatchUpdateFieldPermissionsDto } from './dto/field_permissions.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Field Permissions')
@ApiBearerAuth()
@Controller('field-permissions')
export class FieldPermissionsController {
  constructor(private readonly fieldPermissionsService: FieldPermissionsService) {}

  @Get('module/:moduleName')
  @ApiOperation({ summary: 'Get field permissions matrix for a module' })
  async getPermissions(
    @Param('moduleName') moduleName: string,
    @TenantId() tenantId: string,
  ) {
    const result = await this.fieldPermissionsService.getPermissionsForModule(tenantId, moduleName);
    return DataResponseDto.success(result, 'Permissions fetched successfully');
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch save field permissions for a module' })
  async savePermissions(
    @TenantId() tenantId: string,
    @Body() dto: BatchUpdateFieldPermissionsDto,
  ) {
    const result = await this.fieldPermissionsService.savePermissions(tenantId, dto);
    return DataResponseDto.success(result, 'Permissions saved successfully');
  }
}
