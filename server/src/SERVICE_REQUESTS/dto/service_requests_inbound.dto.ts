import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsNumber } from 'class-validator';

export class InboundServiceRequestDto {
  @ApiProperty({ description: 'Customer full name', example: 'John Doe' })
  @IsString()
  customer_name: string;

  @ApiPropertyOptional({ description: 'Customer email', example: 'john@example.com' })
  @IsString()
  @IsOptional()
  customer_email?: string;

  @ApiPropertyOptional({ description: 'Customer phone', example: '+1-555-0100' })
  @IsString()
  @IsOptional()
  customer_phone?: string;

  @ApiProperty({ description: 'Subject of the service request', example: 'AC not cooling' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'Detailed description', example: 'Unit runs but no cold air.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'], example: 'medium' })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Service category', example: 'AC Service' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Full service address', example: '123 Main St, Dubai' })
  @IsString()
  @IsOptional()
  service_address?: string;

  @ApiPropertyOptional({ description: 'External reference ID from the calling system', example: 'BLUESTAR-1234567890' })
  @IsString()
  @IsOptional()
  external_ref_id?: string;

  @ApiPropertyOptional({ description: 'GPS latitude', example: 25.2048 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'GPS longitude', example: 55.2708 })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ description: 'Additional custom fields', example: { preferred_time: 'Morning' } })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
