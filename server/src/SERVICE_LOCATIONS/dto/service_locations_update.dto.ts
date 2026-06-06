import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsObject } from 'class-validator';

export class UpdateServiceLocationDto {
  @ApiPropertyOptional({ description: 'Contact ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({ description: 'Company ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({ description: 'Service location address', example: '123 Main St, City, State 12345' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: 37.7749 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: -122.4194 })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ description: 'Access notes', example: 'Enter through side gate' })
  @IsString()
  @IsOptional()
  access_notes?: string;

  @ApiPropertyOptional({ description: 'Gate code', example: '#1234' })
  @IsString()
  @IsOptional()
  gate_code?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { parking_instructions: 'Park in front' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
