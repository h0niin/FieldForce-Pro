import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class WorkOrderQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by status (e.g. new, scheduled, in_progress, completed)' })
  @IsString()
  @IsOptional()
  readonly status?: string;

  @ApiPropertyOptional({ description: 'Filter by priority (low, medium, high, urgent)' })
  @IsString()
  @IsOptional()
  readonly priority?: string;
}
