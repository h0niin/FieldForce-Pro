import { IsString, IsNotEmpty, IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFieldPermissionDto {
  @ApiProperty({ example: 'email' })
  @IsString()
  @IsNotEmpty()
  field_name: string;

  @ApiProperty({ example: 'd3b07384-d113-4956-be6d-2098d3d2e1b1' })
  @IsUUID()
  @IsNotEmpty()
  role_id: string;

  @ApiProperty({ example: 'read_write', enum: ['none', 'read', 'read_write'] })
  @IsEnum(['none', 'read', 'read_write'])
  @IsNotEmpty()
  access_level: 'none' | 'read' | 'read_write';
}

export class BatchUpdateFieldPermissionsDto {
  @ApiProperty({ example: 'Contacts' })
  @IsString()
  @IsNotEmpty()
  module_name: string;

  @ApiProperty({ type: [UpdateFieldPermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFieldPermissionDto)
  permissions: UpdateFieldPermissionDto[];
}
