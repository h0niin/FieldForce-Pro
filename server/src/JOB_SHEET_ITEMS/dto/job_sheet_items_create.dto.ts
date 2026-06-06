import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsInt } from 'class-validator';

export class CreateJobSheetItemDto {
  @ApiProperty({ description: 'Instance ID (FK to job_sheet_instances)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  instance_id: string;

  @ApiProperty({ description: 'Item label', example: 'Check refrigerant pressure' })
  @IsString()
  label: string;

  @ApiPropertyOptional({
    description: 'Item type',
    enum: ['checkbox', 'text', 'photo', 'signature', 'number', 'date'],
    example: 'checkbox',
  })
  @IsEnum(['checkbox', 'text', 'photo', 'signature', 'number', 'date'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Entered value', example: 'true' })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({ description: 'Photo URL', example: 'https://storage.example.com/photos/abc123.jpg' })
  @IsString()
  @IsOptional()
  photo_url?: string;

  @ApiPropertyOptional({ description: 'Whether the item is required', example: false })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', example: 0 })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
