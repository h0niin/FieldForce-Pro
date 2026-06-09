import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModuleMappingsService } from './module_mappings.service';
import { SaveModuleMappingsDto } from './dto/module_mappings.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Module Mappings')
@ApiBearerAuth()
@Controller('module-mappings')
export class ModuleMappingsController {
  constructor(private readonly moduleMappingsService: ModuleMappingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get field mappings for a source and target module pair' })
  async getMappings(
    @TenantId() tenantId: string,
    @Query('sourceModule') sourceModule: string,
    @Query('targetModule') targetModule: string,
  ) {
    const mappings = await this.moduleMappingsService.getMappings(tenantId, sourceModule, targetModule);
    return DataResponseDto.success(mappings, 'Mappings retrieved successfully');
  }

  @Get('fields')
  @ApiOperation({ summary: 'Get available fields (standard + custom) for source and target modules' })
  async getFields(
    @TenantId() tenantId: string,
    @Query('sourceModule') sourceModule: string,
    @Query('targetModule') targetModule: string,
  ) {
    const sourceFields = await this.moduleMappingsService.getFieldsForModule(tenantId, sourceModule);
    const targetFields = await this.moduleMappingsService.getFieldsForModule(tenantId, targetModule);
    return DataResponseDto.success(
      { sourceFields, targetFields },
      'Module fields retrieved successfully',
    );
  }

  @Post('save')
  @ApiOperation({ summary: 'Save field mappings' })
  async saveMappings(
    @TenantId() tenantId: string,
    @Body() dto: SaveModuleMappingsDto,
  ) {
    const mappings = await this.moduleMappingsService.saveMappings(tenantId, dto);
    return DataResponseDto.success(mappings, 'Mappings saved successfully');
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset field mappings to defaults' })
  async resetMappings(
    @TenantId() tenantId: string,
    @Body('sourceModule') sourceModule: string,
    @Body('targetModule') targetModule: string,
  ) {
    const mappings = await this.moduleMappingsService.resetMappings(tenantId, sourceModule, targetModule);
    return DataResponseDto.success(mappings, 'Mappings reset successfully');
  }
}
