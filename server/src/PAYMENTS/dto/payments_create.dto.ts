import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Invoice ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  invoice_id: string;

  @ApiProperty({ description: 'Payment amount', example: 500.0 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: ['card', 'cash', 'bank_transfer', 'online', 'check', 'other'],
    default: 'card',
  })
  @IsEnum(['card', 'cash', 'bank_transfer', 'online', 'check', 'other'])
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({
    description: 'Gateway transaction ID',
    example: 'txn_1234567890',
  })
  @IsString()
  @IsOptional()
  gateway_transaction_id?: string;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  })
  @IsEnum(['pending', 'completed', 'failed', 'refunded'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Date when payment was made',
    example: '2024-12-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  paid_at?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Partial payment via credit card' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { receipt_number: 'RCP-001' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
