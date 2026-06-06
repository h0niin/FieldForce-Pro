import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean, IsEnum, IsObject } from 'class-validator';

export class CreateAssetMaintenancePlanDto {
  @ApiProperty({ description: 'Asset ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  asset_id: string;

  @ApiProperty({ description: 'Plan name', example: 'Quarterly HVAC Filter Replacement' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Plan description', example: 'Replace air filters and inspect ductwork' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Maintenance frequency', example: 'quarterly', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] })
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  frequency: string;

  @ApiPropertyOptional({ description: 'Next due date', example: '2026-04-15' })
  @IsDateString()
  @IsOptional()
  next_due_date?: string;

  @ApiPropertyOptional({ description: 'Auto-create work order when due', example: true })
  @IsBoolean()
  @IsOptional()
  auto_create_wo?: boolean;

  @ApiPropertyOptional({ description: 'Custom fields (JSONB)' })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
