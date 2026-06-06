import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsObject } from 'class-validator';

export class ReportQueryDto {
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
    example: { status: 'completed', assigned_to: '550e8400-e29b-41d4-a716-446655440000' },
  })
  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;
}
