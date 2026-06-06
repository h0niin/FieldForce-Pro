import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  IsUrl,
  IsObject,
} from 'class-validator';

export class CreateEstimateDto {
  @ApiPropertyOptional({
    description: 'Service request ID reference',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  request_id?: string;

  @ApiPropertyOptional({
    description: 'Work order ID reference (no formal FK)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  work_order_id?: string;

  @ApiPropertyOptional({
    description: 'Contact ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({
    description: 'Estimate number (auto-generated if not provided)',
    example: 'EST-2024-001',
  })
  @IsString()
  @IsOptional()
  estimate_number?: string;

  @ApiPropertyOptional({
    description: 'Estimate status',
    enum: ['draft', 'pending_approval', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted_to_wo', 'converted_to_invoice'],
    default: 'draft',
  })
  @IsEnum(['draft', 'pending_approval', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted_to_wo', 'converted_to_invoice'])
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

  @ApiPropertyOptional({ description: 'Expiry date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  expiry_date?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date',
    example: '2024-12-31T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduled_start?: string;

  @ApiPropertyOptional({
    description: 'Customer signature URL',
    example: 'https://storage.example.com/signatures/sig123.png',
  })
  @IsUrl()
  @IsOptional()
  signature_url?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Valid for 30 days' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { priority: 'high' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
