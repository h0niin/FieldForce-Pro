import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateWorkOrderLineItemDto {
  @ApiProperty({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  work_order_id: string;

  @ApiPropertyOptional({
    description: 'Line item type',
    enum: ['service', 'part', 'travel'],
    default: 'service',
  })
  @IsEnum(['service', 'part', 'travel'])
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Line item name', example: 'HVAC Filter Replacement' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Line item description', example: 'Replace standard HVAC filter' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 2, default: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price', example: 49.99, default: 0 })
  @IsNumber()
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Tax rate (%)', example: 8.5, default: 0 })
  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Discount type', enum: ['fixed', 'percentage'], default: 'fixed' })
  @IsEnum(['fixed', 'percentage'])
  @IsOptional()
  discount_type?: string;

  @ApiPropertyOptional({ description: 'Discount amount or percentage', example: 5.0, default: 0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 94.98, default: 0 })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Sort order', example: 0, default: 0 })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
