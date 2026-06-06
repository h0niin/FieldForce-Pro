import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { AutoAssignmentService, AssignmentStrategy, AssignmentCriteria } from './auto-assignment.service';
import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';

export class AutoAssignWorkOrderDto {
  @IsString()
  workOrderId: string;

  @IsEnum(AssignmentStrategy)
  strategy: AssignmentStrategy;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsString()
  territory?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;
}

export class AutoAssignServiceRequestDto {
  @IsString()
  serviceRequestId: string;

  @IsEnum(AssignmentStrategy)
  strategy: AssignmentStrategy;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsString()
  territory?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}

@ApiTags('Auto Assignment')
@Controller('auto-assignment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AutoAssignmentController {
  constructor(private readonly autoAssignmentService: AutoAssignmentService) {}

  @Post('work-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-assign a work order to a technician' })
  @ApiResponse({ status: 200, description: 'Work order assigned successfully' })
  @Permissions('work_orders:update')
  async assignWorkOrder(
    @TenantId() tenantId: string,
    @Body() dto: AutoAssignWorkOrderDto,
  ) {
    const criteria: AssignmentCriteria = {
      strategy: dto.strategy,
      skills: dto.skills,
      territory: dto.territory,
      priority: dto.priority,
      customerId: dto.customerId,
      assetId: dto.assetId,
      serviceType: dto.serviceType,
    };

    const result = await this.autoAssignmentService.assignWorkOrder(
      tenantId,
      dto.workOrderId,
      criteria,
    );

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: result.success,
      message: result.success
        ? `Work order assigned to ${result.assignedToName} using ${result.strategy} strategy`
        : result.reason || 'Assignment failed',
      data: result,
    });
  }

  @Post('service-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-assign a service request to a technician' })
  @ApiResponse({ status: 200, description: 'Service request assigned successfully' })
  @Permissions('service_requests:update')
  async assignServiceRequest(
    @TenantId() tenantId: string,
    @Body() dto: AutoAssignServiceRequestDto,
  ) {
    const criteria: AssignmentCriteria = {
      strategy: dto.strategy,
      skills: dto.skills,
      territory: dto.territory,
      priority: dto.priority,
    };

    const result = await this.autoAssignmentService.assignServiceRequest(
      tenantId,
      dto.serviceRequestId,
      criteria,
    );

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: result.success,
      message: result.success
        ? `Service request assigned using ${result.strategy} strategy`
        : result.reason || 'Assignment failed',
      data: result,
    });
  }

  @Post('bulk-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk assign multiple work orders' })
  @ApiResponse({ status: 200, description: 'Bulk assignment completed' })
  @Permissions('work_orders:update')
  async bulkAssign(
    @TenantId() tenantId: string,
    @Body() dto: { workOrderIds: string[]; strategy: AssignmentStrategy },
  ) {
    const results = await Promise.all(
      dto.workOrderIds.map(async (workOrderId) => {
        const result = await this.autoAssignmentService.assignWorkOrder(
          tenantId,
          workOrderId,
          { strategy: dto.strategy },
        );
        return { workOrderId, ...result };
      }),
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: `Bulk assignment completed: ${successCount} succeeded, ${failureCount} failed`,
      data: results,
    });
  }
}