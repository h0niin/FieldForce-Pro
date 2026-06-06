import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Order, PAGINATION_DEFAULTS } from '../constants/constants';

export class PageOptionsDto {
  @ApiPropertyOptional({ enum: Order, default: Order.DESC })
  @IsEnum(Order)
  @IsOptional()
  readonly order: Order = Order.DESC;

  @ApiPropertyOptional({ minimum: 1, default: PAGINATION_DEFAULTS.PAGE })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page: number = PAGINATION_DEFAULTS.PAGE;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: PAGINATION_DEFAULTS.TAKE })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_DEFAULTS.MAX_TAKE)
  @IsOptional()
  readonly take: number = PAGINATION_DEFAULTS.TAKE;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly search?: string;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
