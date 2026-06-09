import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsNumber, IsObject, IsNotEmpty, IsEnum } from 'class-validator';
import { AssetStatus } from '../assets.entity';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name', example: 'HVAC Unit - Carrier 24ACC636A003' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Contact (customer) ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  contact_id: string;

  @ApiProperty({ description: 'Company ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiPropertyOptional({ description: 'Parent Asset ID' })
  @IsUUID()
  @IsOptional()
  parent_asset_id?: string;

  @ApiPropertyOptional({ description: 'Service location ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  service_location_id?: string;

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
  installation_date?: string;

  @ApiPropertyOptional({ description: 'Warranty expiry date', example: '2029-01-15' })
  @IsDateString()
  @IsOptional()
  warranty_expiry?: string;

  @ApiPropertyOptional({ description: 'Ordered date' })
  @IsDateString()
  @IsOptional()
  ordered_date?: string;

  @ApiPropertyOptional({ description: 'Purchased date' })
  @IsDateString()
  @IsOptional()
  purchased_date?: string;

  @ApiPropertyOptional({ description: 'GIAI' })
  @IsString()
  @IsOptional()
  giai?: string;


  @ApiProperty({ description: 'Asset category', example: 'HVAC' })
  @IsString()
  @IsNotEmpty()
  product_category: string;

  @ApiPropertyOptional({ description: 'Status of the asset', enum: AssetStatus })
  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

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
