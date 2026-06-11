import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, IsBoolean, IsInt, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchUpdateFieldItemDto {
  @ApiProperty({ description: 'Custom field ID', example: 'uuid-here' })
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(255)
  @IsOptional()
  field_label?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(100)
  @IsOptional()
  section_name?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  section_order?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  char_limit?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_pii?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_encrypted?: boolean;
}

export class BatchUpdateCustomFieldsDto {
  @ApiProperty({ type: [BatchUpdateFieldItemDto], description: 'Array of field updates' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateFieldItemDto)
  fields: BatchUpdateFieldItemDto[];
}
