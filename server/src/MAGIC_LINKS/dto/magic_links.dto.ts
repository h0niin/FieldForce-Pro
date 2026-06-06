import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateMagicLinkDto {
  @ApiProperty({ description: 'UUID of the target user who will receive the magic link' })
  @IsUUID()
  @IsNotEmpty()
  target_user_id: string;

  @ApiProperty({ enum: ['super_admin_access', 'admin_onboarding', 'user_access', 'user_onboarding'] })
  @IsEnum(['super_admin_access', 'admin_onboarding', 'user_access', 'user_onboarding'])
  purpose: 'super_admin_access' | 'admin_onboarding' | 'user_access' | 'user_onboarding';
}

export class CompleteOnboardingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @IsNotEmpty()
  new_password: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
}
