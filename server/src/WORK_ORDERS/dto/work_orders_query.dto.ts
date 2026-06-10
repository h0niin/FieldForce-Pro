import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Filter by asset ID' })
  @IsUUID()
  @IsOptional()
  readonly asset_id?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsUUID()
  @IsOptional()
  readonly contact_id?: string;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsUUID()
  @IsOptional()
  readonly company_id?: string;
}
