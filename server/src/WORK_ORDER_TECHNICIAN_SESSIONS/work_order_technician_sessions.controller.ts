import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkOrderTechnicianSessionsService } from './work_order_technician_sessions.service';
import { TechnicianSessionRejectDto } from './dto/technician_session_reject.dto';
import { TechnicianSessionTripDto } from './dto/technician_session_trip.dto';
import { TechnicianSessionFinishDto } from './dto/technician_session_finish.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Work Order Technician Sessions')
@ApiBearerAuth()
@Controller('work-orders/:id/technician-session')
export class WorkOrderTechnicianSessionsController {
  constructor(
    private readonly sessionsService: WorkOrderTechnicianSessionsService,
  ) {}

  @Get()
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get technician session for a work order' })
  async getSession(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const session = await this.sessionsService.getSession(tenantId, workOrderId);
    return DataResponseDto.success(session, 'Technician session fetched successfully');
  }

  @Post('init')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Initialize (get or create) technician session for a work order' })
  async initSession(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.getOrCreateSession(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Technician session initialized');
  }

  @Post('approve')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician approves the work order assignment' })
  async approve(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.approve(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Work order approved by technician');
  }

  @Post('reject')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician rejects the work order assignment' })
  async reject(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TechnicianSessionRejectDto,
  ) {
    const session = await this.sessionsService.reject(tenantId, workOrderId, userId, dto.reason);
    return DataResponseDto.success(session, 'Work order rejected by technician');
  }

  @Post('start-trip')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician starts the trip to service location' })
  async startTrip(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TechnicianSessionTripDto,
  ) {
    const session = await this.sessionsService.startTrip(tenantId, workOrderId, userId, dto);
    return DataResponseDto.success(session, 'Trip started');
  }

  @Post('reached')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician marks arrival at service location' })
  async markReached(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.markReached(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Arrival marked');
  }

  @Post('confirm-items')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician confirms parts/materials checklist' })
  async confirmItems(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.confirmItems(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Items confirmed');
  }

  @Post('confirm-call')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician confirms client call was made' })
  async confirmCall(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.confirmCall(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Client call confirmed');
  }

  @Post('start-work')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician starts the actual work' })
  async startWork(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.startWork(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Work started');
  }

  @Post('pause')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician pauses work' })
  async pauseWork(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.pauseWork(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Work paused');
  }

  @Post('resume')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician resumes work after pause' })
  async resumeWork(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.resumeWork(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Work resumed');
  }

  @Post('mark-before-photos')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician marks before-work photos as uploaded' })
  async markBeforePhotos(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.markBeforePhotos(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'Before photos marked');
  }

  @Post('mark-after-photos')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician marks after-work photos as uploaded' })
  async markAfterPhotos(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const session = await this.sessionsService.markAfterPhotos(tenantId, workOrderId, userId);
    return DataResponseDto.success(session, 'After photos marked');
  }

  @Post('finish')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Technician finishes the job with customer feedback' })
  async finish(
    @Param('id') workOrderId: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TechnicianSessionFinishDto,
  ) {
    const session = await this.sessionsService.finish(tenantId, workOrderId, userId, dto);
    return DataResponseDto.success(session, 'Job finished successfully');
  }
}
