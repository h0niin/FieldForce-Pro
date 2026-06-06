import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsObject } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corporation' })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ description: 'Tax ID / EIN', example: '12-3456789' })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiPropertyOptional({ description: 'Company website', example: 'https://acme.com' })
  @IsUrl()
  @IsOptional()
  website?: string;

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
