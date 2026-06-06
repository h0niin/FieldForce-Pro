import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
  MaxLength,
} from 'class-validator';

export class CreateWorkOrderAttachmentDto {
  @ApiProperty({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  work_order_id: string;

  @ApiPropertyOptional({ description: 'User ID who uploaded the attachment', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ description: 'File URL', example: 'https://storage.example.com/files/photo.jpg' })
  @IsString()
  @MaxLength(500)
  file_url: string;

  @ApiProperty({ description: 'File name', example: 'photo.jpg' })
  @IsString()
  @MaxLength(255)
  file_name: string;

  @ApiPropertyOptional({ description: 'File MIME type', example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  file_type?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1048576 })
  @IsInt()
  @IsOptional()
  file_size?: number;

  @ApiPropertyOptional({
    description: 'Photo type for field workflow',
    enum: ['general', 'before_work', 'after_work'],
    default: 'general',
  })
  @IsEnum(['general', 'before_work', 'after_work'])
  @IsOptional()
  photo_type?: string;
}
