import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsObject, MaxLength } from 'class-validator';

export class CreateMobileAuditLogDto {
  @ApiProperty({ description: 'Action performed', example: 'work_order_status_changed' })
  @IsString()
  @MaxLength(100)
  action: string;

  @ApiProperty({ description: 'Module where action occurred', example: 'work_orders' })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiPropertyOptional({ description: 'ID of the affected record (omit for auth/session events)' })
  @IsUUID()
  @IsOptional()
  record_id?: string;

  @ApiPropertyOptional({ description: 'Previous state before the action', example: { status: 'new' } })
  @IsObject()
  @IsOptional()
  old_values?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'New state / event metadata', example: { status: 'in_progress' } })
  @IsObject()
  @IsOptional()
  new_values?: Record<string, unknown>;
}
