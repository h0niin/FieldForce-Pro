import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreatePricebookDto {
  @ApiPropertyOptional({
    description: 'Service ID (FK to services_catalog)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  service_id?: string;

  @ApiProperty({ description: 'Pricebook entry name', example: 'Standard HVAC Service' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Pricing tier',
    enum: ['good', 'better', 'best'],
    example: 'good',
  })
  @IsEnum(['good', 'better', 'best'])
  tier: string;

  @ApiProperty({ description: 'Price amount', example: 150.0 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Standard tier HVAC service pricing' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
