import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsObject } from 'class-validator';

export enum ReportExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
}

export class ReportExportDto {
  @ApiProperty({
    description: 'Export format',
    enum: ReportExportFormat,
    example: ReportExportFormat.PDF,
  })
  @IsEnum(ReportExportFormat)
  format: ReportExportFormat;

  @ApiPropertyOptional({ description: 'Start date for the report range', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for the report range', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Module to filter by', example: 'work_orders' })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({
    description: 'Additional filters (JSONB)',
    example: { status: 'completed' },
  })
  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;
}
