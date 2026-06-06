import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class PaymentQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by status (pending, completed, failed, refunded)' })
  @IsString()
  @IsOptional()
  readonly status?: string;
}
