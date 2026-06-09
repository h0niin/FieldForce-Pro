import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityLogsService } from './activity_logs.service';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity logs by entity' })
  async findByEntity(
    @Request() req: any,
    @Query('entity_type') entityType: string,
    @Query('entity_id') entityId: string,
  ) {
    const data = await this.activityLogsService.findByEntity(
      req.user.tenant_id,
      entityType,
      entityId,
    );
    return DataResponseDto.success(data, 'Activity logs retrieved successfully');
  }
}
