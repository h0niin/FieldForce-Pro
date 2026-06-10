import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateServiceRequestNoteDto {
  @ApiProperty({ description: 'Service request ID', example: 'uuid' })
  @IsUUID()
  service_request_id: string;

  @ApiPropertyOptional({ description: 'Author user ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Author display name (denormalized)', example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  author_name?: string;

  @ApiProperty({ description: 'Note content', example: 'Dispatcher confirmed availability' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
