import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceRequestsService } from './service_requests.service';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { TenantGuard } from '../shared/guards/tenant.guard';

@ApiTags('Queue')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  @Permissions('service_requests:read')
  @ApiOperation({ summary: 'Get priority-sorted service requests queue' })
  async getQueue(@TenantId() tenantId: string) {
    const queue = await this.serviceRequestsService.getQueue(tenantId);
    return DataResponseDto.success(queue, 'Queue fetched successfully');
  }

  @Patch(':id/priority')
  @Permissions('service_requests:update')
  @ApiOperation({ summary: 'Update priority of a service request' })
  async updatePriority(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body('priority') priority: string,
  ) {
    const request = await this.serviceRequestsService.updatePriority(id, tenantId, userId, priority);
    return DataResponseDto.success(request, 'Priority updated successfully');
  }
}
