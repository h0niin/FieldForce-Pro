import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class InvoiceQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by status (e.g. draft, sent, viewed, paid, overdue, void)' })
  @IsString()
  @IsOptional()
  readonly status?: string;
}
