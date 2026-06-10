import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SlaConfigService } from './sla_config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { SlaService } from './sla.service';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { CreateSlaPolicyDto, UpdateSlaPolicyDto, CreateWorkingCalendarDto, CreateSlaEscalationDto, CreateSlaPauseTriggerDto } from './dto/sla_config.dto';

@Controller('sla-config')
@UseGuards(JwtAuthGuard)
export class SlaConfigController {
  constructor(
    private readonly slaConfigService: SlaConfigService,
    private readonly slaService: SlaService,
  ) {}

  @Get('policies')
  async getPolicies(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllPolicies(tenantId);
    return DataResponseDto.success(data);
  }

  @Post('policies')
  async createPolicy(@CurrentUser('tenant_id') tenantId: string, @Body() body: CreateSlaPolicyDto) {
    const data = await this.slaConfigService.createPolicy(tenantId, body);
    return DataResponseDto.created(data);
  }

  @Put('policies/:id')
  async updatePolicy(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string, @Body() body: UpdateSlaPolicyDto) {
    const data = await this.slaConfigService.updatePolicy(id, tenantId, body);
    return DataResponseDto.success(data);
  }

  @Delete('policies/:id')
  async deletePolicy(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string) {
    await this.slaConfigService.deletePolicy(id, tenantId);
    return DataResponseDto.success(null, 'Policy deleted successfully');
  }

  @Get('calendars')
  async getCalendars(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllCalendars(tenantId);
    return DataResponseDto.success(data);
  }

  @Post('calendars')
  async createCalendar(@CurrentUser('tenant_id') tenantId: string, @Body() body: CreateWorkingCalendarDto) {
    const data = await this.slaConfigService.createCalendar(tenantId, body);
    return DataResponseDto.created(data);
  }

  @Put('calendars/:id')
  async updateCalendar(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.updateCalendar(id, tenantId, body);
    return DataResponseDto.success(data);
  }

  @Delete('calendars/:id')
  async deleteCalendar(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string) {
    await this.slaConfigService.deleteCalendar(id, tenantId);
    return DataResponseDto.success(null, 'Calendar deleted successfully');
  }

  @Get('escalations')
  async getEscalations(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllEscalations(tenantId);
    return DataResponseDto.success(data);
  }

  @Post('escalations')
  async createEscalation(@CurrentUser('tenant_id') tenantId: string, @Body() body: CreateSlaEscalationDto) {
    const data = await this.slaConfigService.createEscalation(tenantId, body);
    return DataResponseDto.created(data);
  }

  @Put('escalations/:id')
  async updateEscalation(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.updateEscalation(id, tenantId, body);
    return DataResponseDto.success(data);
  }

  @Delete('escalations/:id')
  async deleteEscalation(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string) {
    await this.slaConfigService.deleteEscalation(id, tenantId);
    return DataResponseDto.success(null, 'Escalation deleted successfully');
  }

  @Get('pause-triggers')
  async getPauseTriggers(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaConfigService.findAllPauseTriggers(tenantId);
    return DataResponseDto.success(data);
  }

  @Post('pause-triggers')
  async createPauseTrigger(@CurrentUser('tenant_id') tenantId: string, @Body() body: CreateSlaPauseTriggerDto) {
    const data = await this.slaConfigService.createPauseTrigger(tenantId, body);
    return DataResponseDto.created(data);
  }

  @Put('pause-triggers/:id')
  async updatePauseTrigger(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string, @Body() body: any) {
    const data = await this.slaConfigService.updatePauseTrigger(id, tenantId, body);
    return DataResponseDto.success(data);
  }

  @Delete('pause-triggers/:id')
  async deletePauseTrigger(@Param('id') id: string, @CurrentUser('tenant_id') tenantId: string) {
    await this.slaConfigService.deletePauseTrigger(id, tenantId);
    return DataResponseDto.success(null, 'Pause trigger deleted successfully');
  }

  @Get('analytics')
  async getAnalytics(@CurrentUser('tenant_id') tenantId: string) {
    const data = await this.slaService.getAnalytics(tenantId);
    return DataResponseDto.success(data);
  }
}
