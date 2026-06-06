import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    description: 'Work order ID reference',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  work_order_id?: string;

  @ApiPropertyOptional({
    description: 'Contact ID reference',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({
    description: 'Service request ID this invoice is raised against',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  @IsOptional()
  service_request_id?: string;

  @ApiPropertyOptional({
    description: 'Invoice number (auto-generated if not provided)',
    example: 'INV-000001',
  })
  @IsString()
  @IsOptional()
  invoice_number?: string;

  @ApiPropertyOptional({
    description: 'Invoice status',
    enum: ['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void'],
    default: 'draft',
  })
  @IsEnum(['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Subtotal amount', example: 1000.0 })
  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 80.0 })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 50.0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 1030.0 })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ description: 'Due date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ description: 'Paid amount', example: 0 })
  @IsNumber()
  @IsOptional()
  paid_amount?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Payment due within 30 days' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'PDF URL of the invoice',
    example: 'https://storage.example.com/invoices/inv-001.pdf',
  })
  @IsString()
  @IsOptional()
  pdf_url?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { priority: 'high' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
