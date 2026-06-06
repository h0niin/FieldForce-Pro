import { IsDateString, IsIn, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTenantSubscriptionDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  plan_id?: string;

  @ApiPropertyOptional({ enum: ['trial', 'active', 'suspended', 'cancelled', 'expired'] })
  @IsIn(['trial', 'active', 'suspended', 'cancelled', 'expired'])
  @IsOptional()
  subscription_status?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  subscription_end?: string;

  @ApiPropertyOptional({ nullable: true, description: 'null clears the override, a number overrides plan limit' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max_users_override?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'null clears the override, a number overrides plan limit' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max_appointments_override?: number | null;
}
