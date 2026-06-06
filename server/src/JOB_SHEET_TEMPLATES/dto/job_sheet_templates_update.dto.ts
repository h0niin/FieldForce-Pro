import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class UpdateJobSheetTemplateDto {
  @ApiPropertyOptional({ description: 'Template name', example: 'HVAC Installation Checklist' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description', example: 'Standard checklist for HVAC installation jobs' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category', example: 'HVAC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Array of template item definitions (JSONB)',
    example: [{ label: 'Check refrigerant levels', type: 'checkbox', is_required: true }],
  })
  @IsArray()
  @IsOptional()
  items?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Whether the template is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { department: 'Maintenance' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
