import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsInt, IsObject } from 'class-validator';

export class UpdatePartsCatalogDto {
  @ApiPropertyOptional({ description: 'Part name', example: 'Air Filter' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Stock Keeping Unit', example: 'AF-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Part description', example: 'High-efficiency air filter' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Unit price', example: 29.99 })
  @IsNumber()
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Stock quantity', example: 100 })
  @IsInt()
  @IsOptional()
  stock_qty?: number;

  @ApiPropertyOptional({ description: 'Reorder level', example: 10 })
  @IsInt()
  @IsOptional()
  reorder_level?: number;

  @ApiPropertyOptional({ description: 'Supplier name', example: 'ABC Supplies Inc.' })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({ description: 'Part category', example: 'Filters' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the part is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { weight_kg: 0.5 },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
