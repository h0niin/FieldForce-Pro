import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Template type',
    enum: ['invoice', 'estimate', 'email', 'report', 'job_sheet'],
  })
  @IsEnum(['invoice', 'estimate', 'email', 'report', 'job_sheet'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Template name', example: 'Default Invoice Template' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Associated module name' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  module_name?: string;

  @ApiPropertyOptional({
    description: 'Template content (JSONB)',
    example: { header: 'Invoice', body: '<html>...</html>', styles: {} },
  })
  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is default template' })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
