import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsDateString,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateUserDocumentDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID('4')
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    example: 'certification',
    enum: ['certification', 'license', 'id_proof', 'insurance', 'contract', 'other'],
  })
  @IsEnum(['certification', 'license', 'id_proof', 'insurance', 'contract', 'other'])
  @IsNotEmpty()
  document_type: 'certification' | 'license' | 'id_proof' | 'insurance' | 'contract' | 'other';

  @ApiProperty({ example: 'Electrician License' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  document_name: string;

  @ApiProperty({ example: 'https://storage.example.com/documents/license.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  file_url: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  file_type?: string;

  @ApiPropertyOptional({ example: 1024000 })
  @IsOptional()
  @IsNumber()
  file_size?: number;

  @ApiPropertyOptional({ example: '2023-01-01' })
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({ example: 'State Licensing Board' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  issuing_authority?: string;

  @ApiPropertyOptional({ example: 'LIC-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  document_number?: string;

  @ApiPropertyOptional({ example: 'Valid for commercial work' })
  @IsOptional()
  @IsString()
  notes?: string;
}
