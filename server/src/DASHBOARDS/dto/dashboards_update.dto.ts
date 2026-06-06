import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class UpdateDashboardDto {
  @ApiPropertyOptional({ description: 'Dashboard name', example: 'Operations Overview' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Dashboard widgets configuration (JSONB)',
    example: [{ type: 'chart', title: 'Work Orders by Status', config: {} }],
  })
  @IsArray()
  @IsOptional()
  widgets?: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Whether this is the default dashboard', example: false })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
