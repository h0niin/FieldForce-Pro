import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class PortalAuthDto {
  @ApiProperty({
    description: 'Contact email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Reference number (service request ID, work order number, or invoice number)',
    example: 'WO-00123',
  })
  @IsString()
  reference_number: string;
}

export class PortalTokenDto {
  @ApiProperty({ description: 'Portal access token' })
  @IsString()
  token: string;
}

export class PortalCreateServiceRequestDto {
  @ApiProperty({ description: 'Subject of the service request', example: 'AC Unit Not Cooling' })
  @IsString()
  @MaxLength(300)
  subject: string;

  @ApiPropertyOptional({ description: 'Detailed description of the issue' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Service category', example: 'HVAC' })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
  })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsOptional()
  priority?: string;

  @ApiProperty({ description: 'Contact full name', example: 'John Doe' })
  @IsString()
  contact_name: string;

  @ApiProperty({ description: 'Contact email', example: 'john@example.com' })
  @IsEmail()
  contact_email: string;

  @ApiProperty({ description: 'Contact phone', example: '(555) 123-4567' })
  @IsString()
  contact_phone: string;

  @ApiProperty({ description: 'Latitude of the selected location', example: 25.276987 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude of the selected location', example: 55.296249 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ description: 'Address string from map' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Service location ID (if an existing location was selected)' })
  @IsUUID()
  @IsOptional()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Custom or AI Diagnosis fields' })
  @IsOptional()
  custom_fields?: Record<string, any>;
}

export class PortalMakePaymentDto {
  @ApiProperty({ description: 'Portal access token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Invoice ID to pay' })
  @IsUUID()
  invoice_id: string;

  @ApiProperty({ description: 'Payment amount', example: 150.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['card', 'bank_transfer', 'online'],
    example: 'card',
  })
  @IsEnum(['card', 'bank_transfer', 'online'])
  method: string;

  @ApiPropertyOptional({
    description: 'Gateway transaction ID from payment processor',
  })
  @IsString()
  @IsOptional()
  gateway_transaction_id?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
