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
  @ApiPropertyOptional({ description: 'Field name (API name)', example: 'warranty_expiry' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  field_name?: string;

  @ApiPropertyOptional({ description: 'Display label', example: 'Warranty Expiry' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  field_label?: string;

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

  @ApiPropertyOptional({ description: 'Field options (for dropdown, multi_select, etc.)' })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is field required' })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Sort order within section' })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Section/group name in layout', example: 'Contact Details' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  section_name?: string;

  @ApiPropertyOptional({ description: 'Order of section within module layout' })
  @IsInt()
  @IsOptional()
  section_order?: number;

  @ApiPropertyOptional({ description: 'Whether the field is visible in the layout' })
  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;

  @ApiPropertyOptional({ description: 'Character limit for text fields' })
  @IsInt()
  @IsOptional()
  char_limit?: number;

  @ApiPropertyOptional({ description: 'Whether this field contains PII' })
  @IsBoolean()
  @IsOptional()
  is_pii?: boolean;

  @ApiPropertyOptional({ description: 'Whether the field value should be encrypted at rest' })
  @IsBoolean()
  @IsOptional()
  is_encrypted?: boolean;
}
