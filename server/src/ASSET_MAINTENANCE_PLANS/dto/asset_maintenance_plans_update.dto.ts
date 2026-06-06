import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean, IsEnum, IsObject } from 'class-validator';

export class UpdateAssetMaintenancePlanDto {
  @ApiPropertyOptional({ description: 'Asset ID' })
  @IsUUID()
  @IsOptional()
  asset_id?: string;

  @ApiPropertyOptional({ description: 'Plan name', example: 'Quarterly HVAC Filter Replacement' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Maintenance frequency', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Next due date', example: '2026-04-15' })
  @IsDateString()
  @IsOptional()
  next_due_date?: string;

  @ApiPropertyOptional({ description: 'Last completed date', example: '2026-01-15' })
  @IsDateString()
  @IsOptional()
  last_completed_date?: string;

  @ApiPropertyOptional({ description: 'Auto-create work order when due' })
  @IsBoolean()
  @IsOptional()
  auto_create_wo?: boolean;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Custom fields (JSONB)' })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
