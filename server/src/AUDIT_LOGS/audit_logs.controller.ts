import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditLogsService } from './audit_logs.service';
import { AuditLogQueryDto } from './dto/audit_logs_query.dto';
import { CreateMobileAuditLogDto } from './dto/audit_logs_mobile_create.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record a mobile app audit event (user_id extracted from JWT)' })
  async create(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
    @Body() dto: CreateMobileAuditLogDto,
  ) {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ipAddress = forwarded?.split(',')[0]?.trim() ?? req.ip ?? '';
    const userAgent = (req.headers['user-agent'] as string | undefined) ?? '';

    const auditLog = await this.auditLogsService.create(tenantId, {
      user_id: userId,
      action: dto.action,
      module: dto.module,
      record_id: dto.record_id,
      old_values: dto.old_values,
      new_values: dto.new_values,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    return DataResponseDto.success(auditLog, 'Audit log created');
  }

  @Get()
  @Permissions('audit_logs:read')
  @ApiOperation({ summary: 'Get all audit logs (paginated, with filters)' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() queryDto: AuditLogQueryDto,
  ) {
    const result = await this.auditLogsService.findAllPaginated(tenantId, queryDto, queryDto);
    return DataResponseDto.success(result.data, 'Audit logs fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get(':id')
  @Permissions('audit_logs:read')
  @ApiOperation({ summary: 'Get audit log by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const auditLog = await this.auditLogsService.findById(id, tenantId);
    return DataResponseDto.success(auditLog);
  }
}
