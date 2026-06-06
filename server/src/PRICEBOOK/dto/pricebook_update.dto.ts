import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdatePricebookDto {
  @ApiPropertyOptional({
    description: 'Service ID (FK to services_catalog)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  service_id?: string;

  @ApiPropertyOptional({ description: 'Pricebook entry name', example: 'Standard HVAC Service' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Pricing tier',
    enum: ['good', 'better', 'best'],
  })
  @IsEnum(['good', 'better', 'best'])
  @IsOptional()
  tier?: string;

  @ApiPropertyOptional({ description: 'Price amount', example: 150.0 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Standard tier HVAC service pricing' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
