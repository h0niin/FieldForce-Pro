import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  MaxLength,
} from 'class-validator';

export class UpdateBlueprintStateDto {
  @ApiPropertyOptional({
    description: 'Blueprint definition ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  blueprint_id?: string;

  @ApiPropertyOptional({
    description: 'State name',
    example: 'In Progress',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'State color (hex)',
    example: '#3498db',
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the initial state',
  })
  @IsBoolean()
  @IsOptional()
  is_initial?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a final state',
  })
  @IsBoolean()
  @IsOptional()
  is_final?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 0,
  })
  @IsInt()
  @IsOptional()
  sort_order?: number;
}
