import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateWorkOrderNoteDto {
  @ApiPropertyOptional({ description: 'Note content', example: 'Updated note content.' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ description: 'Is this an internal note (not visible to customer)' })
  @IsBoolean()
  @IsOptional()
  is_internal?: boolean;
}
