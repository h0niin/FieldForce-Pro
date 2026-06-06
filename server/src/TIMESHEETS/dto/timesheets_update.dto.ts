import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  IsDateString,
} from 'class-validator';

export class UpdateTimesheetDto {
  @ApiPropertyOptional({ description: 'User ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Service appointment ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  appointment_id?: string;

  @ApiPropertyOptional({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  work_order_id?: string;

  @ApiPropertyOptional({ description: 'Clock in time', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  clock_in?: string;

  @ApiPropertyOptional({ description: 'Clock out time', example: '2025-01-15T17:00:00Z' })
  @IsDateString()
  @IsOptional()
  clock_out?: string;

  @ApiPropertyOptional({ description: 'Travel time in minutes', example: 30 })
  @IsNumber()
  @IsOptional()
  travel_time_minutes?: number;

  @ApiPropertyOptional({ description: 'Work time in minutes', example: 420 })
  @IsNumber()
  @IsOptional()
  work_time_minutes?: number;

  @ApiPropertyOptional({ description: 'Break time in minutes', example: 60 })
  @IsNumber()
  @IsOptional()
  break_time_minutes?: number;

  @ApiPropertyOptional({ description: 'Is this time billable' })
  @IsBoolean()
  @IsOptional()
  is_billable?: boolean;

  @ApiPropertyOptional({ description: 'Notes about the timesheet entry', example: 'Worked on HVAC repair' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Timesheet status',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsEnum(['pending', 'approved', 'rejected'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'UUID of approver', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  approved_by?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { overtime: true },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
