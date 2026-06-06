import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsObject,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SensorReadingDto {
  @ApiProperty()
  @IsString()
  sensor_type: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipment_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  recorded_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateIoTDataDto {
  @ApiProperty()
  @IsUUID()
  asset_id: string;

  @ApiProperty()
  @IsString()
  sensor_type: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  recorded_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class IoTWebhookDto {
  @ApiProperty({ type: [SensorReadingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorReadingDto)
  readings: SensorReadingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  asset_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class QueryIoTDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  asset_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sensor_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  take?: number;
}
