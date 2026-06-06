import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SlaConfigService } from './sla_config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorator/current-user.decorator';

@Controller('api/v1/sla-config')
@UseGuards(JwtAuthGuard)
export class SlaConfigController {
  constructor(private readonly slaConfigService: SlaConfigService) {}

  @Get('policies')
  async getPolicies(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllPolicies(tenantId);
    return { success: true, data };
  }

  @Post('policies')
  async createPolicy(@CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.createPolicy(tenantId, body);
    return { success: true, data };
  }

  @Get('calendars')
  async getCalendars(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllCalendars(tenantId);
    return { success: true, data };
  }

  @Post('calendars')
  async createCalendar(@CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.createCalendar(tenantId, body);
    return { success: true, data };
  }

  @Get('escalations')
  async getEscalations(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllEscalations(tenantId);
    return { success: true, data };
  }

  @Post('escalations')
  async createEscalation(@CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.createEscalation(tenantId, body);
    return { success: true, data };
  }

  @Get('pause-triggers')
  async getPauseTriggers(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllPauseTriggers(tenantId);
    return { success: true, data };
  }

  @Post('pause-triggers')
  async createPauseTrigger(@CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.createPauseTrigger(tenantId, body);
    return { success: true, data };
  }
}
