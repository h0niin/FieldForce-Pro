import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateDashboardDto {
  @ApiProperty({ description: 'Dashboard name', example: 'Operations Overview' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'User ID who owns the dashboard', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  user_id: string;

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
