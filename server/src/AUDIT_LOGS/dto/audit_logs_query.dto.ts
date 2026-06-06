import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString, MaxLength } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class AuditLogQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by module', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({ description: 'Filter by action', example: 'create' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Start date filter', example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date filter', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
