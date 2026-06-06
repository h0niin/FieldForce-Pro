import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'users:read' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'users' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  module?: string;

  @ApiPropertyOptional({
    example: 'read',
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  })
  @IsOptional()
  @IsEnum(['create', 'read', 'update', 'delete', 'manage'])
  action?: 'create' | 'read' | 'update' | 'delete' | 'manage';

  @ApiPropertyOptional({ example: 'Allows reading user data' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
