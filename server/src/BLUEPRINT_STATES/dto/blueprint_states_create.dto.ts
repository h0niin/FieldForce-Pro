import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateBlueprintStateDto {
  @ApiProperty({
    description: 'Blueprint definition ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  blueprint_id: string;

  @ApiProperty({
    description: 'State name',
    example: 'In Progress',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'State color (hex)',
    example: '#3498db',
    default: '#cccccc',
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the initial state',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_initial?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a final state',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_final?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 0,
    default: 0,
  })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
