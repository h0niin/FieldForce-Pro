import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsArray,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({ description: 'Service request ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  request_id?: string;

  @ApiPropertyOptional({ description: 'Estimate ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  estimate_id?: string;

  @ApiPropertyOptional({ description: 'Contact ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({ description: 'Service location ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Asset ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  asset_id?: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['low', 'medium', 'high', 'urgent'],
  })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Category', example: 'HVAC' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Work order summary', example: 'Fix broken AC unit' })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Detailed description', example: 'The AC unit in building A is not cooling.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Scheduled date', example: '2025-01-15T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  scheduled_start?: string;

  @ApiPropertyOptional({ description: 'Actual start date', example: '2025-01-15T09:30:00Z' })
  @IsDateString()
  @IsOptional()
  actual_start?: string;

  @ApiPropertyOptional({ description: 'Actual end date', example: '2025-01-15T16:00:00Z' })
  @IsDateString()
  @IsOptional()
  actual_end?: string;

  @ApiPropertyOptional({ description: 'Assigned technician UUID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'Tags', example: ['hvac', 'urgent'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is this a recurring work order', default: false })
  @IsBoolean()
  @IsOptional()
  is_recurring?: boolean;

  @ApiPropertyOptional({ description: 'iCalendar RRULE recurrence rule', example: 'FREQ=WEEKLY;INTERVAL=2' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  recurrence_rule?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { source: 'phone_call' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
