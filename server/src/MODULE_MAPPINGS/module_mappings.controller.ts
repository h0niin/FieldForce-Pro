import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ModuleMappingsService } from './module_mappings.service';
import { ModuleMapping } from './module_mappings.entity';

@Controller('module-mappings')
export class ModuleMappingsController {
  constructor(private readonly moduleMappingsService: ModuleMappingsService) {}

  @Get()
  async getMappings(
    @Req() req: any,
    @Query('sourceModule') sourceModule: string,
    @Query('targetModule') targetModule: string
  ) {
    const tenantId = req.user.tenant_id;
    return this.moduleMappingsService.getMappings(tenantId, sourceModule, targetModule);
  }

  @Get('fields')
  async getFields(
    @Req() req: any,
    @Query('sourceModule') sourceModule: string,
    @Query('targetModule') targetModule: string
  ) {
    const tenantId = req.user.tenant_id;
    return this.moduleMappingsService.getFields(tenantId, sourceModule, targetModule);
  }

  @Post('save')
  async save(
    @Req() req: any,
    @Body() data: { sourceModule: string; targetModule: string; mappings: any[] }
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.moduleMappingsService.save(tenantId, data.sourceModule, data.targetModule, data.mappings, userId);
  }

  @Post('reset')
  async reset(
    @Req() req: any,
    @Body() data: { sourceModule: string; targetModule: string }
  ) {
    const tenantId = req.user.tenant_id;
    return this.moduleMappingsService.reset(tenantId, data.sourceModule, data.targetModule);
  }
}
