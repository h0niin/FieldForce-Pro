import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsNumber, IsObject } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name', example: 'HVAC Unit - Carrier 24ACC636A003' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Contact (customer) ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({ description: 'Service location ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Model number', example: '24ACC636A003' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN-2024-001234' })
  @IsString()
  @IsOptional()
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Manufacturer', example: 'Carrier' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Installation date', example: '2024-01-15' })
  @IsDateString()
  @IsOptional()
  install_date?: string;

  @ApiPropertyOptional({ description: 'Warranty expiry date', example: '2029-01-15' })
  @IsDateString()
  @IsOptional()
  warranty_expiry?: string;

  @ApiPropertyOptional({ description: 'Health score (0-100)', example: 85.5 })
  @IsNumber()
  @IsOptional()
  health_score?: number;

  @ApiPropertyOptional({ description: 'Asset category', example: 'HVAC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Located on rooftop' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { floor: '3rd', building: 'Main Office' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
