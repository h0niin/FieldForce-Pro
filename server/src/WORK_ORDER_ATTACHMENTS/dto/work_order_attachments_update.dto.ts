import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
} from 'class-validator';

export class UpdateWorkOrderAttachmentDto {
  @ApiPropertyOptional({ description: 'File URL', example: 'https://storage.example.com/files/photo.jpg' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  file_url?: string;

  @ApiPropertyOptional({ description: 'File name', example: 'photo.jpg' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  file_name?: string;

  @ApiPropertyOptional({ description: 'File MIME type', example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  file_type?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1048576 })
  @IsInt()
  @IsOptional()
  file_size?: number;
}
