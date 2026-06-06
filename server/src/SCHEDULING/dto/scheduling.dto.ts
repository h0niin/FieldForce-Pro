import { IsUUID, IsDateString, IsEnum, IsOptional, IsObject, IsNumber, IsArray, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WorkOrderInput {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsObject()
  service_location: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @ApiProperty()
  @IsNumber()
  @Min(15)
  @Max(480)
  estimated_duration: number;

  @ApiProperty()
  @IsDateString()
  time_window_start: string;

  @ApiProperty()
  @IsDateString()
  time_window_end: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  required_skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  territory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;
}

export class TechnicianInput {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  @IsNumber()
  start_lat: number;

  @ApiProperty()
  @IsNumber()
  start_lng: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  end_lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  end_lng?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  territories?: string[];

  @ApiProperty()
  @IsDateString()
  shift_start: string;

  @ApiProperty()
  @IsDateString()
  shift_end: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  max_jobs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  max_distance?: number;
}

export class SchedulingConstraints {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(300)
  optimization_time_limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  use_traffic_data?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allow_overtime?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  buffer_percentage?: number;
}

export class OptimizeScheduleDto {
  @ApiProperty({ type: [WorkOrderInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderInput)
  work_orders: WorkOrderInput[];

  @ApiProperty({ type: [TechnicianInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechnicianInput)
  technicians: TechnicianInput[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SchedulingConstraints)
  constraints?: SchedulingConstraints;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  optimization_date?: string;
}

export class DemandForecastDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  historical_data: Array<{
    date: string;
    demand: number;
  }>;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Max(365)
  horizon_days: number;

  @ApiPropertyOptional()
  @IsOptional()
  service_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  include_seasonality?: boolean;
}

export class RouteOptimizationDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  locations: Array<{
    id: string;
    latitude: number;
    longitude: number;
    address: string;
    duration?: number;
  }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  start_location?: {
    latitude: number;
    longitude: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  end_location?: {
    latitude: number;
    longitude: number;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  use_traffic?: boolean;
}

export class GetOptimizationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['vrp', 'demand_forecast', 'realtime', 'recommendation'])
  optimization_type?: string;

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
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class ApplyOptimizationDto {
  @ApiProperty()
  @IsUUID()
  optimization_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notify_technicians?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auto_create_appointments?: boolean;
}

// --- Availability & Conflict Detection ---

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Technician (agent) UUID' })
  @IsUUID()
  agent_id: string;

  @ApiProperty()
  @IsDateString()
  start_time: string;

  @ApiProperty()
  @IsDateString()
  end_time: string;
}

export class AutoAssignDto {
  @ApiProperty({ description: 'Work order UUID to auto-assign' })
  @IsUUID()
  work_order_id: string;

  @ApiProperty()
  @IsDateString()
  scheduled_start: string;

  @ApiPropertyOptional({ description: 'Scheduled end (defaults to scheduled_start + 8 hours if omitted)' })
  @IsDateString()
  @IsOptional()
  scheduled_end?: string;

  @ApiPropertyOptional({ description: 'Required skills for the job' })
  @IsOptional()
  @IsArray()
  required_skills?: string[];

  @ApiPropertyOptional({ description: 'Territory where the job is located' })
  @IsOptional()
  territory?: string;
}

export class ConflictCheckDto {
  @ApiProperty({ description: 'Technician (agent) UUID' })
  @IsUUID()
  agent_id: string;

  @ApiProperty()
  @IsDateString()
  start_time: string;

  @ApiProperty()
  @IsDateString()
  end_time: string;

  @ApiPropertyOptional({ description: 'Appointment ID to exclude from conflict check (for edits)' })
  @IsOptional()
  @IsUUID()
  exclude_appointment_id?: string;
}