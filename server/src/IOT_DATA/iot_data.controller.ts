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
} from '@nestjs/swagger';
import { IoTDataService } from './iot_data.service';
import { IoTWebhookDto, QueryIoTDataDto } from './dto/iot_data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { Permissions } from '../shared/decorator/permission.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';

@ApiTags('IoT Data')
@Controller('iot-data')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class IoTDataController {
  constructor(private readonly iotDataService: IoTDataService) {}

  @Post('webhook')
  @Permissions('iot.write')
  @ApiOperation({ summary: 'Receive IoT sensor data webhook' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sensor data ingested successfully',
  })
  async ingestWebhook(
    @Body() dto: IoTWebhookDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.iotDataService.ingestBatch(dto, tenantId);
    return {
      statusCode: HttpStatus.CREATED,
      status: true,
      message: `Ingested ${result.total_stored}/${result.total_received} readings`,
      data: result,
    };
  }

  @Get()
  @Permissions('iot.read')
  @ApiOperation({ summary: 'Query IoT sensor data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'IoT data retrieved successfully',
  })
  async getIoTData(
    @Query() query: QueryIoTDataDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.iotDataService.getHistoryByAsset(query, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'IoT data retrieved successfully',
      data: result.data,
      meta: { total: result.total },
    };
  }

  @Get('latest/:assetId')
  @Permissions('iot.read')
  @ApiOperation({ summary: 'Get latest sensor readings for an asset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Latest readings retrieved successfully',
  })
  async getLatestReadings(
    @Param('assetId') assetId: string,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const readings = await this.iotDataService.getLatestReadings(assetId, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Latest readings retrieved successfully',
      data: readings,
    };
  }

  @Get('health-score/:assetId')
  @Permissions('iot.read')
  @ApiOperation({ summary: 'Get AI health score for an asset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health score retrieved successfully',
  })
  async getHealthScore(
    @Param('assetId') assetId: string,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const token = `mock_token_${tenantId}`;
    const result = await this.iotDataService.getHealthScore(assetId, tenantId, token);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Health score retrieved',
      data: result || { health_score: null, message: 'AI service unavailable' },
    };
  }
}
