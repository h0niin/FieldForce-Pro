import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  tenant_id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  first_name: string;

  @Expose()
  @ApiProperty()
  last_name: string;

  @Expose()
  @ApiPropertyOptional()
  phone: string;

  @Expose()
  @ApiPropertyOptional()
  avatar_url: string;

  @Expose()
  @ApiProperty()
  timezone: string;

  @Expose()
  @ApiProperty()
  language: string;

  @Expose()
  @ApiProperty()
  email_verified: boolean;

  @Expose()
  @ApiProperty()
  phone_verified: boolean;

  @Expose()
  @ApiProperty()
  is_active: boolean;

  @Expose()
  @ApiPropertyOptional()
  last_login_at: Date;

  @Expose()
  @ApiProperty()
  created_at: Date;

  @Expose()
  @ApiProperty()
  updated_at: Date;
}
