import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  IsInt,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateServiceAgreementDto {
  @ApiPropertyOptional({
    description: 'Contact ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiProperty({
    description: 'Agreement name',
    example: 'Annual Maintenance Contract',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Agreement type',
    enum: ['maintenance', 'warranty', 'sla'],
  })
  @IsEnum(['maintenance', 'warranty', 'sla'])
  type: string;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date', example: '2024-12-31' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({
    description: 'Recurrence pattern',
    example: 'monthly',
  })
  @IsString()
  @IsOptional()
  recurrence?: string;

  @ApiPropertyOptional({
    description: 'SLA response time in hours',
    example: 4,
  })
  @IsInt()
  @IsOptional()
  sla_response_hours?: number;

  @ApiPropertyOptional({
    description: 'SLA resolution time in hours',
    example: 24,
  })
  @IsInt()
  @IsOptional()
  sla_resolution_hours?: number;

  @ApiPropertyOptional({ description: 'Agreement value', example: 5000.0 })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({
    description: 'Agreement status',
    enum: ['draft', 'active', 'expired', 'cancelled', 'renewed'],
    default: 'draft',
  })
  @IsEnum(['draft', 'active', 'expired', 'cancelled', 'renewed'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Covers all preventive maintenance visits',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { coverage_type: 'full' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
