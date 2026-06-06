import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
} from 'class-validator';

export class CreateInvoiceLineItemDto {
  @ApiProperty({
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  invoice_id: string;

  @ApiPropertyOptional({
    description: 'Line item type',
    enum: ['service', 'part', 'travel', 'other'],
    default: 'service',
  })
  @IsEnum(['service', 'part', 'travel', 'other'])
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Line item name', example: 'HVAC Repair Service' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Line item description',
    example: 'Full repair of HVAC compressor unit',
  })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiPropertyOptional({ description: 'Discount type', enum: ['fixed', 'percentage'], default: 'fixed' })
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
}
