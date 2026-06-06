import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsObject,
  MaxLength,
} from 'class-validator';

export class UpdateCustomFieldDto {
  @ApiPropertyOptional({ description: 'Module name', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({ description: 'Field name', example: 'warranty_expiry' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  field_name?: string;

  @ApiPropertyOptional({
    description: 'Field type',
    enum: [
      'text', 'number', 'date', 'dropdown', 'checkbox',
      'multi_select', 'lookup', 'email', 'phone', 'url',
      'textarea', 'currency', 'percentage', 'file', 'image',
    ],
  })
  @IsEnum([
    'text', 'number', 'date', 'dropdown', 'checkbox',
    'multi_select', 'lookup', 'email', 'phone', 'url',
    'textarea', 'currency', 'percentage', 'file', 'image',
  ])
  @IsOptional()
  field_type?: string;

  @ApiPropertyOptional({
    description: 'Field options (for dropdown, multi_select, etc.)',
    example: { choices: ['Option A', 'Option B'] },
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
