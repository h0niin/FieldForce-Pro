import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateTimeBasedRuleDto {
  @ApiPropertyOptional({ description: 'Rule name', example: 'Notify before SLA expiry' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Module this rule applies to', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({ description: 'The date field to base the trigger on', example: 'scheduled_start' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  date_field?: string;

  @ApiPropertyOptional({ enum: ['before', 'after', 'on'] })
  @IsEnum(['before', 'after', 'on'])
  @IsOptional()
  offset_direction?: 'before' | 'after' | 'on';

  @ApiPropertyOptional({ description: 'Number of units before/after' })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset_value?: number;

  @ApiPropertyOptional({ enum: ['days', 'hours', 'weeks'] })
  @IsEnum(['days', 'hours', 'weeks'])
  @IsOptional()
  offset_unit?: 'days' | 'hours' | 'weeks';

  @ApiPropertyOptional({ description: 'Conditions (JSONB)' })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Actions to execute (JSONB)' })
  @IsObject()
  @IsOptional()
  actions?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is rule active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
