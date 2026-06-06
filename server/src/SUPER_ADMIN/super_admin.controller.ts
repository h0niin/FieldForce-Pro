import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdminService } from './super_admin.service';
import { SuperAdminGuard } from '../shared/guards/super-admin.guard';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { UpdateSuperAdminProfileDto, ChangeSuperAdminEmailDto } from './dto/super-admin-profile.dto';
import { UpdateTenantSubscriptionDto } from './dto/update_tenant_subscription.dto';
import { UpdateSubscriptionPlanDto } from './dto/update_subscription_plan.dto';


import { SuperAdminAnalyticsService } from './SUPER_ADMIN_ANALYTICS/super_admin_analytics.service';
import { SubscriptionMagicLinksService } from '../SUBSCRIPTION_MAGIC_LINKS/subscription_magic_links.service';
import { SuperAdminHealthService } from './SUPER_ADMIN_HEALTH/super_admin_health.service';
import { SuperAdminApiKeysService } from './SUPER_ADMIN_API_KEYS/super_admin_api_keys.service';
import { SuperAdminAuditLogsService } from './SUPER_ADMIN_AUDIT_LOGS/super_admin_audit_logs.service';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('admin')
export class SuperAdminController {
  constructor(
    private readonly superAdminService: SuperAdminService,
    private readonly analyticsService: SuperAdminAnalyticsService,
    private readonly healthService: SuperAdminHealthService,
    private readonly apiKeysService: SuperAdminApiKeysService,
    private readonly auditLogsService: SuperAdminAuditLogsService,
    private readonly subscriptionMagicLinksService: SubscriptionMagicLinksService,
  ) {}

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants with basic stats' })
  async listTenants() {
    const tenants = await this.superAdminService.listTenants();
    return DataResponseDto.success(tenants, 'Tenants fetched successfully');
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get single tenant details with usage stats' })
  async getTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.getTenant(id);
    return DataResponseDto.success(tenant);
  }

  @Get('tenants/:id/overview')
  @ApiOperation({ summary: 'Get comprehensive read-only overview of a tenant (for Super Admin tenant view)' })
  async getTenantOverview(@Param('id') id: string) {
    const overview = await this.superAdminService.getTenantOverview(id);
    return DataResponseDto.success(overview, 'Tenant overview fetched successfully');
  }

  @Get('subscription-plans')
  @ApiOperation({ summary: 'List all active subscription plans' })
  async listSubscriptionPlans() {
    const plans = await this.superAdminService.listSubscriptionPlans();
    return DataResponseDto.success(plans, 'Subscription plans fetched');
  }

  @Patch('subscription-plans/:id')
  @ApiOperation({ summary: 'Update a subscription plan' })
  async updateSubscriptionPlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    const plan = await this.superAdminService.updateSubscriptionPlan(id, dto);
    return DataResponseDto.success(plan, 'Subscription plan updated successfully');
  }


  @Patch('tenants/:id/subscription')
  @ApiOperation({ summary: 'Update a tenant subscription plan, status, and limits' })
  async updateTenantSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateTenantSubscriptionDto,
  ) {
    const tenant = await this.superAdminService.updateTenantSubscription(id, dto);
    return DataResponseDto.success(tenant, 'Tenant subscription updated successfully');
  }

  @Get('tenants/:id/usage')
  @ApiOperation({ summary: 'Get tenant subscription usage stats' })
  async getTenantUsage(@Param('id') id: string) {
    const usage = await this.superAdminService.getTenantUsage(id);
    return DataResponseDto.success(usage, 'Tenant usage fetched successfully');
  }

  // ── Subscription Magic Links ──────────────────────────────────────────────

  @Post('magic-links')
  @ApiOperation({ summary: 'Generate a subscription onboarding magic link' })
  async generateMagicLink(
    @CurrentUser() user: { id: string },
    @Body() body: { plan_id: string; max_uses?: number; expires_in_days?: number; notes?: string },
  ) {
    const { link, token } = await this.subscriptionMagicLinksService.create(user.id, body);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return DataResponseDto.created(
      { ...link.toJSON(), signup_url: `${frontendUrl}/signup?token=${token}` },
      'Magic link generated',
    );
  }

  @Get('magic-links')
  @ApiOperation({ summary: 'List all subscription magic links' })
  async listMagicLinks() {
    const links = await this.subscriptionMagicLinksService.findAll();
    return DataResponseDto.success(links);
  }

  @Patch('magic-links/:id/disable')
  @ApiOperation({ summary: 'Disable a subscription magic link' })
  async disableMagicLink(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const link = await this.subscriptionMagicLinksService.disable(id, user.id);
    return DataResponseDto.success(link, 'Magic link disabled');
  }

  @Delete('magic-links/:id')
  @ApiOperation({ summary: 'Delete an unused subscription magic link' })
  async deleteMagicLink(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    await this.subscriptionMagicLinksService.remove(id, user.id);
    return DataResponseDto.success(null, 'Magic link deleted');
  }

  @Patch('tenants/:id/suspend')
  @ApiOperation({ summary: 'Suspend a tenant — disables their access' })
  async suspendTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.suspendTenant(id);
    return DataResponseDto.success(tenant, 'Tenant suspended successfully');
  }

  @Patch('tenants/:id/activate')
  @ApiOperation({ summary: 'Re-activate a suspended tenant' })
  async activateTenant(@Param('id') id: string) {
    const tenant = await this.superAdminService.activateTenant(id);
    return DataResponseDto.success(tenant, 'Tenant activated successfully');
  }

  @Get('platform-health')
  @ApiOperation({ summary: 'Basic platform-wide stats for the Super Admin' })
  async platformHealth() {
    const stats = await this.superAdminService.getPlatformHealth();
    return DataResponseDto.success(stats, 'Platform health fetched successfully');
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update super admin profile details (first name, last name)' })
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSuperAdminProfileDto,
  ) {
    const result = await this.superAdminService.updateProfile(user.id, dto);
    return DataResponseDto.success(result, 'Profile updated successfully');
  }

  @Patch('profile/email')
  @ApiOperation({ summary: 'Change super admin email address with password verification' })
  async changeEmail(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangeSuperAdminEmailDto,
  ) {
    const result = await this.superAdminService.changeSuperAdminEmail(user.id, dto.current_password, dto.new_email);
    return DataResponseDto.success(result, 'Email updated successfully');
  }

  // --- Analytics Endpoints ---

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get KPI summary for Super Admin Dashboard' })
  async getAnalyticsOverview() {
    const overview = await this.analyticsService.getOverviewMetrics();
    return DataResponseDto.success(overview, 'Analytics overview fetched');
  }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue trends' })
  async getRevenueTrends(@Query('period') period: 'monthly' | 'yearly' = 'monthly') {
    const trends = await this.analyticsService.getRevenueTrends(period);
    return DataResponseDto.success(trends, 'Revenue trends fetched');
  }

  @Get('analytics/adoption')
  @ApiOperation({ summary: 'Get feature adoption by tenant plan' })
  async getAdoptionMetrics() {
    const metrics = await this.analyticsService.getAdoptionMetrics();
    return DataResponseDto.success(metrics, 'Adoption metrics fetched');
  }

  // --- Health Endpoints ---

  @Get('health/status')
  @ApiOperation({ summary: 'Get real-time system health JSON' })
  async getSystemHealth() {
    const health = await this.healthService.getHealthStatus();
    return DataResponseDto.success(health, 'System health fetched');
  }

  // --- API Keys Endpoints ---

  @Get('api-keys')
  @ApiOperation({ summary: 'List Super Admin API Keys' })
  async listApiKeys(@CurrentUser() user: { id: string }) {
    const keys = await this.apiKeysService.listKeys(user.id);
    return DataResponseDto.success(keys, 'API Keys fetched');
  }

  @Post('api-keys')
  @ApiOperation({ summary: 'Generate a new API Key' })
  async createApiKey(
    @CurrentUser() user: { id: string },
    @Body('key_name') keyName: string,
    @Body('expires_in_days') expiresInDays?: number,
  ) {
    const key = await this.apiKeysService.createKey(user.id, keyName, expiresInDays);
    await this.auditLogsService.logAction(user.id, 'CREATE_API_KEY', 'API Key', key.id);
    return DataResponseDto.success(key, 'API Key created successfully');
  }

  @Delete('api-keys/:id')
  @ApiOperation({ summary: 'Revoke an API Key' })
  async revokeApiKey(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    await this.apiKeysService.revokeKey(user.id, id);
    await this.auditLogsService.logAction(user.id, 'REVOKE_API_KEY', 'API Key', id);
    return DataResponseDto.success({ id }, 'API Key revoked successfully');
  }

  @Patch('api-keys/:id/regenerate')
  @ApiOperation({ summary: 'Rotate/Regenerate an API Key' })
  async regenerateApiKey(
    @CurrentUser() user: { id: string }, 
    @Param('id') id: string,
    @Body('key_name') keyName: string,
  ) {
    await this.apiKeysService.revokeKey(user.id, id);
    const newKey = await this.apiKeysService.createKey(user.id, keyName);
    await this.auditLogsService.logAction(user.id, 'REGENERATE_API_KEY', 'API Key', newKey.id);
    return DataResponseDto.success(newKey, 'API Key regenerated successfully');
  }

  // --- Audit Logs Endpoints ---

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated audit logs' })
  async getAuditLogs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('action') action?: string,
  ) {
    const logs = await this.auditLogsService.getLogs(Number(page) || 1, Number(limit) || 50, { action });
    return DataResponseDto.success(logs, 'Audit logs fetched');
  }

  @Get('audit-logs/export')
  @ApiOperation({ summary: 'Export all audit logs' })
  async exportAuditLogs() {
    const logs = await this.auditLogsService.getAllLogsForExport();
    // In a real scenario, this might return CSV directly using Res()
    // For now, we return JSON and frontend converts to CSV.
    return DataResponseDto.success(logs, 'Audit logs exported');
  }
}
