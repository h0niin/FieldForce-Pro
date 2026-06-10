import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template type',
    enum: ['invoice', 'estimate', 'email', 'report', 'job_sheet'],
    example: 'invoice',
  })
  @IsEnum(['invoice', 'estimate', 'email', 'report', 'job_sheet'])
  type: string;

  @ApiProperty({ description: 'Template name', example: 'Default Invoice Template' })
  @IsString()
  @MaxLength(200)
  name: string;

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

  @ApiProperty({
    description: 'Template content (JSONB)',
    example: { header: 'Invoice', body: '<html>...</html>', styles: {} },
  })
  @IsObject()
  content: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is default template', default: false })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
