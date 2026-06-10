import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertWhatsAppChannelDto {
  @ApiPropertyOptional({ enum: ['web_js', 'business_api'] })
  @IsOptional()
  @IsEnum(['web_js', 'business_api'])
  connection_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  display_name?: string;


  @ApiPropertyOptional({ description: 'Meta Cloud API credentials JSON' })
  @IsOptional()
  @IsObject()
  meta_config?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  greeting_message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  confirmation_message?: string;

  @ApiPropertyOptional({ enum: ['24_7', 'office_hours'] })
  @IsOptional()
  @IsEnum(['24_7', 'office_hours'])
  working_hours_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  office_hours?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  required_fields?: Record<string, boolean>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  default_priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  handoff_team?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  blocked_numbers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class TestConnectionDto {
  @ApiPropertyOptional({ description: 'Phone number to send test message to' })
  @IsOptional()
  @IsString()
  test_phone_number?: string;
}
