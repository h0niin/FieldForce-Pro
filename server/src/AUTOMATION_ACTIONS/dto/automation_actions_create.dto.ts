import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class CreateAutomationActionDto {
  @ApiProperty({ description: 'Action name', example: 'Send Welcome Email' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Action description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['email', 'update_field', 'create_record', 'notification', 'webhook'] })
  @IsEnum(['email', 'update_field', 'create_record', 'notification', 'webhook'])
  type: 'email' | 'update_field' | 'create_record' | 'notification' | 'webhook';

  @ApiPropertyOptional({ description: 'Action configuration (JSONB)' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is action enabled', default: true })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;
}
