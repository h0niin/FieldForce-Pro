import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsObject, IsEmail, IsArray } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Company type', example: 'Customer' })
  @IsString()
  @IsOptional()
  company_type?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'info@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Industry type', example: 'Technology' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({
    description: 'Billing address',
    example: '123 Main St, City, State 12345',
  })
  @IsString()
  @IsOptional()
  billing_address?: string;

  @ApiPropertyOptional({
    description: 'Service address',
    example: '456 Service Rd, City, State 12345',
  })
  @IsString()
  @IsOptional()
  service_address?: string;

  @ApiPropertyOptional({ description: 'Tax ID / EIN', example: '12-3456789' })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiPropertyOptional({ description: 'Company website', example: 'https://acme.com' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'Tags', example: ['VIP', 'Enterprise'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Preferred customer' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { annual_revenue: 1000000 },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
