import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoTData } from './iot_data.entity';
import { CreateIoTDataDto, IoTWebhookDto, QueryIoTDataDto } from './dto/iot_data.dto';
import { Op } from 'sequelize';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class IoTDataService {
  private readonly logger = new Logger(IoTDataService.name);
  private aiServiceClient: AxiosInstance;

  constructor(
    @Inject('IOT_DATA_REPOSITORY')
    private iotDataRepository: typeof IoTData,
    private configService: ConfigService,
  ) {
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceClient = axios.create({
      baseURL: aiServiceUrl,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async ingestBatch(dto: IoTWebhookDto, tenantId: string): Promise<{
    total_received: number;
    total_stored: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let storedCount = 0;

    for (const reading of dto.readings) {
      try {
        const assetId = reading.equipment_id || dto.asset_id;
        if (!assetId) {
          errors.push(`Reading missing asset_id: ${reading.sensor_type}`);
          continue;
        }

        await this.iotDataRepository.create({
          tenant_id: tenantId,
          asset_id: assetId,
          sensor_type: reading.sensor_type,
          value: reading.value,
          unit: reading.unit || '',
          recorded_at: reading.recorded_at ? new Date(reading.recorded_at) : new Date(),
          metadata: reading.metadata || {},
          is_deleted: false,
        });
        storedCount++;
      } catch (error) {
        errors.push(`Failed to store ${reading.sensor_type}: ${error.message}`);
      }
    }

    return {
      total_received: dto.readings.length,
      total_stored: storedCount,
      errors,
    };
  }

  async getLatestReadings(
    assetId: string,
    tenantId: string,
    limit: number = 50,
  ): Promise<IoTData[]> {
    return this.iotDataRepository.findAll({
      where: {
        asset_id: assetId,
        tenant_id: tenantId,
        is_deleted: false,
      },
      order: [['recorded_at', 'DESC']],
      limit,
    });
  }

  async getHistoryByAsset(
    query: QueryIoTDataDto,
    tenantId: string,
  ): Promise<{ data: IoTData[]; total: number }> {
    const where: Record<string, any> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (query.asset_id) where.asset_id = query.asset_id;
    if (query.sensor_type) where.sensor_type = query.sensor_type;
    if (query.start_date || query.end_date) {
      where.recorded_at = {};
      if (query.start_date) where.recorded_at[Op.gte] = new Date(query.start_date);
      if (query.end_date) where.recorded_at[Op.lte] = new Date(query.end_date);
    }

    const page = query.page || 1;
    const take = query.take || 50;
    const offset = (page - 1) * take;

    const { rows, count } = await this.iotDataRepository.findAndCountAll({
      where,
      order: [['recorded_at', 'DESC']],
      limit: take,
      offset,
    });

    return { data: rows, total: count };
  }

  async forwardToAI(
    readings: Array<{ sensor_type: string; value: number; equipment_id?: string }>,
    tenantId: string,
    token: string,
  ): Promise<any> {
    try {
      const response = await this.aiServiceClient.post(
        '/api/predict/iot/ingest',
        { sensor_readings: readings },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to forward IoT data to AI service: ${error.message}`);
      return null;
    }
  }

  async getHealthScore(
    assetId: string,
    tenantId: string,
    token: string,
  ): Promise<any> {
    try {
      const latestReadings = await this.getLatestReadings(assetId, tenantId, 100);

      const sensorData = latestReadings.map((r) => ({
        [r.sensor_type]: r.value,
        recorded_at: r.recorded_at,
      }));

      const response = await this.aiServiceClient.post(
        '/api/predict/health-score',
        {
          equipment_id: assetId,
          sensor_data: sensorData,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      return response.data?.data;
    } catch (error) {
      this.logger.error(`Failed to get health score from AI: ${error.message}`);
      return null;
    }
  }

  async checkAndCreateWO(
    prediction: any,
    assetId: string,
    tenantId: string,
  ): Promise<{ should_create: boolean; wo_payload?: any }> {
    const healthScore = prediction?.health_score ?? 100;
    const failureProb = prediction?.failure_probability ?? 0;

    if (healthScore < 40 || failureProb > 0.7) {
      let priority = 'medium';
      if (healthScore < 20 || failureProb > 0.9) priority = 'urgent';
      else if (healthScore < 40 || failureProb > 0.7) priority = 'high';

      return {
        should_create: true,
        wo_payload: {
          title: `Predictive Maintenance Alert - Asset ${assetId}`,
          description: `Auto-generated: Health score ${healthScore}/100, Failure probability ${(failureProb * 100).toFixed(1)}%`,
          priority,
          category: 'preventive_maintenance',
          asset_id: assetId,
          status: 'new',
          tenant_id: tenantId,
          custom_fields: {
            health_score: healthScore,
            failure_probability: failureProb,
            auto_generated: true,
            source: 'ai_predictive_maintenance',
          },
        },
      };
    }

    return { should_create: false };
  }
}
