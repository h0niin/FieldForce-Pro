import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class UpdateAutomationActionDto {
  @ApiPropertyOptional({ description: 'Action name' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Action description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['email', 'update_field', 'create_record', 'notification', 'webhook'] })
  @IsEnum(['email', 'update_field', 'create_record', 'notification', 'webhook'])
  @IsOptional()
  type?: 'email' | 'update_field' | 'create_record' | 'notification' | 'webhook';

  @ApiPropertyOptional({ description: 'Action configuration (JSONB)' })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Is action enabled' })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;
}
