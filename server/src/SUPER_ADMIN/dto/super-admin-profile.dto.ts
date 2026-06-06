import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSuperAdminProfileDto {
  @ApiPropertyOptional({ example: 'Super' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Admin' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;
}

export class ChangeSuperAdminEmailDto {
  @ApiProperty({ example: 'new@fieldforce.com' })
  @IsEmail()
  @IsNotEmpty()
  new_email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  current_password: string;
}
