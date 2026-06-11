import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateServiceAppointmentDto {
  @ApiPropertyOptional({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  work_order_id?: string;

  @ApiPropertyOptional({ description: 'Assigned technician (user) ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  agent_id?: string;

  @ApiPropertyOptional({ description: 'Crew ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  crew_id?: string;

  @ApiPropertyOptional({
    description: 'Appointment status',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
  })
  @IsEnum(['scheduled', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Scheduled start date', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  scheduled_start?: string;

  @ApiPropertyOptional({ description: 'Scheduled end date', example: '2025-01-15T17:00:00Z' })
  @IsDateString()
  @IsOptional()
  scheduled_end?: string;

  @ApiPropertyOptional({ description: 'Actual start date', example: '2025-01-15T09:30:00Z' })
  @IsDateString()
  @IsOptional()
  actual_start?: string;

  @ApiPropertyOptional({ description: 'Actual end date', example: '2025-01-15T16:00:00Z' })
  @IsDateString()
  @IsOptional()
  actual_end?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Bring extra tools for this job' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is this a recurring appointment', default: false })
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
    example: { priority_note: 'VIP customer' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
