import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateWorkOrderNoteDto {
  @ApiProperty({ description: 'Work order ID', example: 'uuid' })
  @IsUUID()
  work_order_id: string;

  @ApiPropertyOptional({ description: 'User ID who created the note', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ description: 'Note content', example: 'Technician arrived on site and assessed the issue.' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Is this an internal note (not visible to customer)', default: true })
  @IsBoolean()
  @IsOptional()
  is_internal?: boolean;
}
