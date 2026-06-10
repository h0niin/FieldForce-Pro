import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsObject } from 'class-validator';

export class CreateSlaPolicyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  sub_category_id?: string;

  @IsOptional()
  @IsUUID()
  priority_id?: string;

  @IsOptional()
  location_id?: string;

  @IsString()
  time_unit: string;

  @IsNumber()
  response_time_minutes: number;

  @IsNumber()
  resolution_time_minutes: number;
}

export class UpdateSlaPolicyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  sub_category_id?: string;

  @IsOptional()
  @IsUUID()
  priority_id?: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;

  @IsOptional()
  @IsString()
  time_unit?: string;

  @IsOptional()
  @IsNumber()
  response_time_minutes?: number;

  @IsOptional()
  @IsNumber()
  resolution_time_minutes?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateWorkingCalendarDto {
  @IsString()
  name: string;

  @IsString()
  timezone: string;

  @IsOptional()
  @IsObject()
  business_hours?: any;
}

export class CreateSlaEscalationDto {
  @IsUUID()
  sla_policy_id: string;

  @IsString()
  trigger_type: string;

  @IsNumber()
  time_threshold_minutes: number;

  @IsString()
  action: string;
}

export class CreateSlaPauseTriggerDto {
  @IsUUID()
  sla_policy_id: string;

  @IsString()
  trigger_status: string;
}
