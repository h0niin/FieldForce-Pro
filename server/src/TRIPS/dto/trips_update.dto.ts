import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
} from 'class-validator';

export class UpdateTripDto {
  @ApiPropertyOptional({ description: 'User ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Service appointment ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  appointment_id?: string;

  @ApiPropertyOptional({ description: 'Start latitude', example: 37.7749295 })
  @IsNumber()
  @IsOptional()
  start_lat?: number;

  @ApiPropertyOptional({ description: 'Start longitude', example: -122.4194155 })
  @IsNumber()
  @IsOptional()
  start_lng?: number;

  @ApiPropertyOptional({ description: 'End latitude', example: 37.7849295 })
  @IsNumber()
  @IsOptional()
  end_lat?: number;

  @ApiPropertyOptional({ description: 'End longitude', example: -122.4094155 })
  @IsNumber()
  @IsOptional()
  end_lng?: number;

  @ApiPropertyOptional({ description: 'Trip start time', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ description: 'Trip end time', example: '2025-01-15T09:45:00Z' })
  @IsDateString()
  @IsOptional()
  end_time?: string;

  @ApiPropertyOptional({ description: 'Distance traveled in kilometers', example: 12.5 })
  @IsNumber()
  @IsOptional()
  distance_km?: number;

  @ApiPropertyOptional({ description: 'Encoded polyline for route visualization' })
  @IsString()
  @IsOptional()
  route_polyline?: string;

  @ApiPropertyOptional({
    description: 'Trip status',
    enum: ['in_progress', 'completed', 'cancelled'],
  })
  @IsEnum(['in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { vehicle_id: 'V-001' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
