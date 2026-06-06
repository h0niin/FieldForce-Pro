import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { SlaTimersService } from './sla_timers.service';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('SLA Timers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sla-timers')
export class SlaTimersController {
  constructor(private readonly slaTimersService: SlaTimersService) {}

  @Get('work-order/:workOrderId')
  @ApiOperation({ summary: 'Get SLA timer for a work order' })
  @ApiParam({ name: 'workOrderId', type: 'string' })
  @Permissions('work_orders:read')
  async getByWorkOrder(
    @TenantId() tenantId: string,
    @Param('workOrderId') workOrderId: string,
  ) {
    const timer = await this.slaTimersService.getTimerByWorkOrder(tenantId, workOrderId);
    return DataResponseDto.success(timer, 'SLA timer retrieved');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get SLA compliance statistics' })
  @Permissions('reports:read')
  async getStats(@TenantId() tenantId: string) {
    const stats = await this.slaTimersService.getTimerStats(tenantId);
    return DataResponseDto.success(stats, 'SLA stats retrieved');
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Manually pause an SLA timer (admin override)' })
  @ApiParam({ name: 'id', type: 'string' })
  @Permissions('work-orders:update')
  @HttpCode(HttpStatus.OK)
  async pauseTimer(
    @Param('id') id: string,
  ) {
    const timer = await this.slaTimersService.pauseTimer(id);
    return DataResponseDto.success(timer, 'SLA timer paused');
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Manually resume an SLA timer (admin override)' })
  @ApiParam({ name: 'id', type: 'string' })
  @Permissions('work-orders:update')
  @HttpCode(HttpStatus.OK)
  async resumeTimer(
    @Param('id') id: string,
  ) {
    const timer = await this.slaTimersService.resumeTimer(id);
    return DataResponseDto.success(timer, 'SLA timer resumed');
  }
}
