import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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

  @ApiPropertyOptional({ description: 'Assigned technician / service resource (user) ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  agent_id?: string;

  @ApiPropertyOptional({ description: 'Crew ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  crew_id?: string;

  @ApiPropertyOptional({
    description: 'Appointment status',
    enum: ['scheduled', 'en_route', 'on_site', 'in_progress', 'on_hold', 'completed', 'cancelled'],
  })
  @IsEnum(['scheduled', 'en_route', 'on_site', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Short summary of the appointment', example: 'AC servicing' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({
    description: 'Appointment type',
    enum: ['Service', 'Installation', 'Maintenance', 'Inspection'],
  })
  @IsEnum(['Service', 'Installation', 'Maintenance', 'Inspection'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Schedule type',
    enum: ['time_bound', 'all_day'],
  })
  @IsEnum(['time_bound', 'all_day'])
  @IsOptional()
  schedule_type?: string;

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

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)', example: '2025-01-20' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Billing status',
    enum: ['not_invoiced', 'invoiced'],
  })
  @IsEnum(['not_invoiced', 'invoiced'])
  @IsOptional()
  billing_status?: string;

  @ApiPropertyOptional({ description: 'Preferred date 1 (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  preferred_date_1?: string;

  @ApiPropertyOptional({ description: 'Preferred date 2 (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  preferred_date_2?: string;

  @ApiPropertyOptional({ description: 'Preferred time' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  preferred_time?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Bring extra tools for this job' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is this a recurring appointment', default: false })
  @Transform(({ obj }) => {
    const raw = obj?.is_recurring;
    return raw === undefined ? undefined : raw === true || raw === 'true';
  })
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
