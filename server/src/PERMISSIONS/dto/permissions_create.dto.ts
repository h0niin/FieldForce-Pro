import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users:read' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'users' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  module: string;

  @ApiProperty({
    example: 'read',
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  })
  @IsEnum(['create', 'read', 'update', 'delete', 'manage'])
  @IsNotEmpty()
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';

  @ApiPropertyOptional({ example: 'Allows reading user data' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
