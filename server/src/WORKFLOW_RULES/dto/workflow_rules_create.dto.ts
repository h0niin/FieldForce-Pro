import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateWorkflowRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'Auto-assign high priority work orders' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Module this rule applies to', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiProperty({ description: 'Event that triggers this rule', example: 'on_create' })
  @IsString()
  @MaxLength(100)
  trigger_event: string;

  @ApiPropertyOptional({
    description: 'Conditions (JSONB)',
    example: { field: 'priority', operator: 'equals', value: 'high' },
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Actions to execute (JSONB)',
    example: { type: 'assign', target: 'senior_technician' },
  })
  @IsObject()
  @IsOptional()
  actions?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is rule active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
