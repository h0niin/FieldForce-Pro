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

  @ApiProperty({ description: 'Field name (API name)', example: 'warranty_expiry' })
  @IsString()
  @MaxLength(100)
  field_name: string;

  @ApiPropertyOptional({ description: 'Display label (overrides field_name in UI)', example: 'Warranty Expiry' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  field_label?: string;

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

  @ApiPropertyOptional({ description: 'Sort order within section', default: 0 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Section/group name in layout', example: 'Contact Details', default: 'General' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  section_name?: string;

  @ApiPropertyOptional({ description: 'Order of section within module layout', default: 0 })
  @IsInt()
  @IsOptional()
  section_order?: number;

  @ApiPropertyOptional({ description: 'Whether this is a built-in system field layout entry', default: false })
  @IsBoolean()
  @IsOptional()
  is_system?: boolean;

  @ApiPropertyOptional({ description: 'Whether the field is visible in the layout', default: true })
  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;

  @ApiPropertyOptional({ description: 'Character limit for text fields', example: 255 })
  @IsInt()
  @IsOptional()
  char_limit?: number;

  @ApiPropertyOptional({ description: 'Whether this field contains PII', default: false })
  @IsBoolean()
  @IsOptional()
  is_pii?: boolean;

  @ApiPropertyOptional({ description: 'Whether the field value should be encrypted at rest', default: false })
  @IsBoolean()
  @IsOptional()
  is_encrypted?: boolean;
}
