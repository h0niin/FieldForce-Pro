import { IsString, IsOptional, IsUUID, IsEnum, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ enum: ['invoice', 'receipt', 'contract', 'report', 'general'] })
  @IsEnum(['invoice', 'receipt', 'contract', 'report', 'general'])
  document_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  corrections?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['reviewed'])
  status?: string;
}

export class QueryDocumentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['invoice', 'receipt', 'contract', 'report', 'general'])
  document_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed', 'reviewed'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
