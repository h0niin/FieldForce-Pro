import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsInt,
} from 'class-validator';

export class UpdateEstimateLineItemDto {
  @ApiPropertyOptional({
    description: 'Estimate ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  estimate_id?: string;

  @ApiPropertyOptional({
    description: 'Line item type',
    enum: ['service', 'labor', 'material', 'part', 'equipment', 'travel', 'other'],
  })
  @IsEnum(['service', 'labor', 'material', 'part', 'equipment', 'travel', 'other'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Line item name', example: 'HVAC Inspection' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Line item description',
    example: 'Full inspection of HVAC system',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Unit of measure', example: 'hrs' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 2.0 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price', example: 150.0 })
  @IsNumber()
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 8.5 })
  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Discount type', enum: ['fixed', 'percentage'] })
  @IsEnum(['fixed', 'percentage'])
  @IsOptional()
  discount_type?: string;

  @ApiPropertyOptional({ description: 'Discount amount or percentage', example: 10.0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 300.0 })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Sort order', example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
