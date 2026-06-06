import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Permission } from '../../PERMISSIONS/permissions.entity';

@Exclude()
export class RoleResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  tenant_id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiPropertyOptional()
  description: string;

  @Expose()
  @ApiProperty()
  is_system: boolean;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;

  @Expose()
  @ApiPropertyOptional({ type: [Permission] })
  @Type(() => Permission)
  permissions?: Permission[];
}
