import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  IsUUID,
} from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Technician' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Field technician with basic permissions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: ['permission-uuid-1', 'permission-uuid-2'],
    description: 'Array of permission IDs to assign to this role',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permission_ids?: string[];
}
