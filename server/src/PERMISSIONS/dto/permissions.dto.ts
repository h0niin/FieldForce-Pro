import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PermissionResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  module: string;

  @Expose()
  @ApiProperty({
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  })
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';

  @Expose()
  @ApiPropertyOptional()
  description: string;
}
