import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, IsObject } from 'class-validator';

export class CreateServicesCatalogDto {
  @ApiProperty({ description: 'Service name', example: 'HVAC Installation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Service description', example: 'Full HVAC system installation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Default price', example: 150.00 })
  @IsNumber()
  @IsOptional()
  default_price?: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 8.25 })
  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 60 })
  @IsInt()
  @IsOptional()
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Service category', example: 'HVAC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the service is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { warranty_months: 12 },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
