import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateCustomFieldDto {
  @ApiProperty({ description: 'Module name', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiProperty({ description: 'Field name', example: 'warranty_expiry' })
  @IsString()
  @MaxLength(100)
  field_name: string;

  @ApiProperty({
    description: 'Field type',
    enum: [
      'text', 'number', 'date', 'dropdown', 'checkbox',
      'multi_select', 'lookup', 'email', 'phone', 'url',
      'textarea', 'currency', 'percentage', 'file', 'image',
    ],
    example: 'text',
  })
  @IsEnum([
    'text', 'number', 'date', 'dropdown', 'checkbox',
    'multi_select', 'lookup', 'email', 'phone', 'url',
    'textarea', 'currency', 'percentage', 'file', 'image',
  ])
  field_type: string;

  @ApiPropertyOptional({
    description: 'Field options (for dropdown, multi_select, etc.)',
    example: { choices: ['Option A', 'Option B'] },
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is field required', default: false })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
