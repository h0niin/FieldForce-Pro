import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  IsUUID,
  IsArray,
  IsObject,
} from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @ApiPropertyOptional({ example: 'Mr.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  salutation?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '+1987654321' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @ApiPropertyOptional({ example: 'secondary@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  secondary_email?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ example: 'Senior Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: '123 Service St, City, State, 12345' })
  @IsOptional()
  @IsString()
  service_address?: string;

  @ApiPropertyOptional({ example: '456 Billing Ave, City, State, 12345' })
  @IsOptional()
  @IsString()
  billing_address?: string;

  @ApiPropertyOptional({ example: ['VIP', 'Enterprise'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: { preferredContactMethod: 'email' } })
  @IsOptional()
  @IsObject()
  custom_fields?: Record<string, unknown>;
}
