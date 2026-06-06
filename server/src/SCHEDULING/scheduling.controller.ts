import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SCHEDULINGService } from './scheduling.service';
import {
  OptimizeScheduleDto,
  DemandForecastDto,
  RouteOptimizationDto,
  GetOptimizationsDto,
  ApplyOptimizationDto,
  CheckAvailabilityDto,
  AutoAssignDto,
  ConflictCheckDto,
} from './dto/scheduling.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { Permissions } from '../shared/decorator/permission.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';

@ApiTags('Scheduling & AI Optimization')
@Controller('scheduling')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class SCHEDULINGController {
  constructor(private readonly schedulingService: SCHEDULINGService) {}

  @Post('optimize')
  @Permissions('scheduling.optimize')
  @ApiOperation({ summary: 'Optimize work order scheduling using AI' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Schedule optimized successfully',
  })
  async optimizeSchedule(
    @Body() dto: OptimizeScheduleDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.optimizeSchedule(dto, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Schedule optimized successfully',
      data: result,
    };
  }

  @Post('forecast/demand')
  @Permissions('scheduling.forecast')
  @ApiOperation({ summary: 'Generate demand forecast using AI' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Demand forecast generated successfully',
  })
  async generateDemandForecast(
    @Body() dto: DemandForecastDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.generateDemandForecast(dto, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Demand forecast generated successfully',
      data: result,
    };
  }

  @Post('optimize/route')
  @Permissions('scheduling.route')
  @ApiOperation({ summary: 'Optimize route for a single technician' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Route optimized successfully',
  })
  async optimizeRoute(
    @Body() dto: RouteOptimizationDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.optimizeRoute(dto, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Route optimized successfully',
      data: result,
    };
  }

  @Get('optimizations')
  @Permissions('scheduling.view')
  @ApiOperation({ summary: 'Get optimization history' })
  @ApiQuery({ name: 'optimization_type', required: false, enum: ['vrp', 'demand_forecast', 'realtime', 'recommendation'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed'] })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimization history retrieved successfully',
  })
  async getOptimizations(
    @Query() dto: GetOptimizationsDto,
    @Query() pageOptions: PageOptionsDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.getOptimizations(dto, pageOptions, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Optimization history retrieved successfully',
      data: result.data,
      meta: result.meta as unknown as Record<string, unknown>,
    };
  }

  @Get('optimizations/:id')
  @Permissions('scheduling.view')
  @ApiOperation({ summary: 'Get optimization by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimization details retrieved successfully',
  })
  async getOptimizationById(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.getOptimizationById(id, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Optimization details retrieved successfully',
      data: result,
    };
  }

  @Post('apply')
  @Permissions('scheduling.apply')
  @ApiOperation({ summary: 'Apply optimization results to create appointments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Optimization applied successfully',
  })
  async applyOptimization(
    @Body() dto: ApplyOptimizationDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.applyOptimization(dto, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Optimization applied successfully',
      data: result,
    };
  }

  @Get('recommendations')
  @Permissions('scheduling.view')
  @ApiOperation({ summary: 'Get AI scheduling recommendations' })
  @ApiQuery({ name: 'start_date', required: true, type: String })
  @ApiQuery({ name: 'end_date', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Scheduling recommendations retrieved successfully',
  })
  async getSchedulingRecommendations(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.getSchedulingRecommendations(
      new Date(startDate),
      new Date(endDate),
      tenantId,
      userId,
    );
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Scheduling recommendations retrieved successfully',
      data: result,
    };
  }

  @Post('optimize/realtime')
  @Permissions('scheduling.optimize')
  @ApiOperation({ summary: 'Real-time route optimization with traffic data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Real-time optimization completed',
  })
  async realtimeOptimization(
    @Body() data: any,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    // This would integrate with real-time traffic APIs
    // For now, use regular route optimization
    const dto: RouteOptimizationDto = {
      locations: data.pending_jobs || [],
      start_location: data.current_location,
      use_traffic: true,
    };

    const result = await this.schedulingService.optimizeRoute(dto, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Real-time optimization completed',
      data: result,
    };
  }

  // ─── Availability & Conflict Detection ────────────────────────────

  @Post('availability/check')
  @Permissions('scheduling.view')
  @ApiOperation({ summary: 'Check technician availability for a time window' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability check completed',
  })
  async checkAvailability(
    @Body() dto: CheckAvailabilityDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.checkAvailability(dto, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: result.available ? 'Technician is available' : 'Technician is not available',
      data: result,
    };
  }

  @Post('conflicts/detect')
  @Permissions('scheduling.view')
  @ApiOperation({ summary: 'Detect scheduling conflicts for a technician' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conflict detection completed',
  })
  async detectConflicts(
    @Body() dto: ConflictCheckDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const conflicts = await this.schedulingService.detectConflicts(dto, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: conflicts.length > 0
        ? `${conflicts.length} conflict(s) detected`
        : 'No conflicts detected',
      data: {
        has_conflicts: conflicts.length > 0,
        conflict_count: conflicts.length,
        conflicts,
      },
    };
  }

  @Post('auto-assign')
  @Permissions('scheduling.optimize')
  @ApiOperation({ summary: 'Auto-assign a work order to the best available technician' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auto-assignment completed',
  })
  async autoAssign(
    @Body() dto: AutoAssignDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.schedulingService.autoAssign(dto, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: result.assigned
        ? `Assigned to ${result.agent_name}`
        : 'No available technician found',
      data: result,
    };
  }
}