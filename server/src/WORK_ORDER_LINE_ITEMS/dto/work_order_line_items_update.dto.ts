import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsInt,
  MaxLength,
} from 'class-validator';

export class UpdateWorkOrderLineItemDto {
  @ApiPropertyOptional({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  work_order_id?: string;

  @ApiPropertyOptional({
    description: 'Line item type',
    enum: ['service', 'part', 'travel'],
  })
  @IsEnum(['service', 'part', 'travel'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Line item name', example: 'HVAC Filter Replacement' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Line item description', example: 'Replace standard HVAC filter' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 2 })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price', example: 49.99 })
  @IsNumber()
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Tax rate (%)', example: 8.5 })
  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Discount type', enum: ['fixed', 'percentage'] })
  @IsEnum(['fixed', 'percentage'])
  @IsOptional()
  discount_type?: string;

  @ApiPropertyOptional({ description: 'Discount amount or percentage', example: 5.0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 94.98 })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
