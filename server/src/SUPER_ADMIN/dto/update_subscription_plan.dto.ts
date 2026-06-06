import { IsNumber, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price_monthly?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price_yearly?: number;

  @ApiPropertyOptional()
  @IsEnum(['USD', 'INR'])
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max_total_users?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max_appointments_monthly?: number | null;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];
}
