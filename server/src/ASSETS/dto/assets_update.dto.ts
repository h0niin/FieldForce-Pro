import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString, IsNumber, IsObject, IsEnum } from 'class-validator';
import { AssetStatus } from '../assets.entity';

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'Asset name', example: 'HVAC Unit - Carrier 24ACC636A003' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Contact (customer) ID' })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({ description: 'Parent Asset ID' })
  @IsUUID()
  @IsOptional()
  parent_asset_id?: string;

  @ApiPropertyOptional({ description: 'Service location ID' })
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


  @ApiPropertyOptional({ description: 'Asset category', example: 'HVAC' })
  @IsString()
  @IsOptional()
  product_category?: string;

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
