import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateServiceAppointmentDto {
  @ApiProperty({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  work_order_id: string;

  @ApiPropertyOptional({ description: 'Assigned technician / service resource (user) ID — null for unassigned', example: 'uuid' })
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
    default: 'scheduled',
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
    default: 'Service',
  })
  @IsEnum(['Service', 'Installation', 'Maintenance', 'Inspection'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Schedule type',
    enum: ['time_bound', 'all_day'],
    default: 'time_bound',
  })
  @IsEnum(['time_bound', 'all_day'])
  @IsOptional()
  schedule_type?: string;

  @ApiProperty({ description: 'Scheduled start date', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  scheduled_start: string;

  @ApiProperty({ description: 'Scheduled end date', example: '2025-01-15T17:00:00Z' })
  @IsDateString()
  scheduled_end: string;

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
    default: 'not_invoiced',
  })
  @IsEnum(['not_invoiced', 'invoiced'])
  @IsOptional()
  billing_status?: string;

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
