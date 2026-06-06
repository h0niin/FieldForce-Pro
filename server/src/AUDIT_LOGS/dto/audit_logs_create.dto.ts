import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsObject, MaxLength } from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'User ID who performed the action', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Action performed', example: 'create' })
  @IsString()
  @MaxLength(50)
  action: string;

  @ApiProperty({ description: 'Module where action occurred', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiProperty({ description: 'ID of the affected record', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  record_id: string;

  @ApiPropertyOptional({
    description: 'Previous values before change (JSONB)',
    example: { status: 'new' },
  })
  @IsObject()
  @IsOptional()
  old_values?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'New values after change (JSONB)',
    example: { status: 'in_progress' },
  })
  @IsObject()
  @IsOptional()
  new_values?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'IP address of the user', example: '192.168.1.1' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  ip_address?: string;

  @ApiPropertyOptional({ description: 'User agent string', example: 'Mozilla/5.0...' })
  @IsString()
  @IsOptional()
  user_agent?: string;
}
