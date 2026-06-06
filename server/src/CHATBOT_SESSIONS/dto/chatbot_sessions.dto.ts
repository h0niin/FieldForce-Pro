import { IsString, IsOptional, IsUUID, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['internal', 'customer_portal'])
  session_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class QuerySessionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['active', 'closed', 'archived'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['internal', 'customer_portal'])
  session_type?: string;
}

export class CloseSessionDto {
  @ApiProperty()
  @IsUUID()
  session_id: string;
}
