import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ description: 'The entity type this note belongs to (e.g., Contact, Company, Asset)' })
  @IsString()
  @IsNotEmpty()
  entity_type: string;

  @ApiProperty({ description: 'The UUID of the entity' })
  @IsUUID()
  @IsNotEmpty()
  entity_id: string;

  @ApiProperty({ description: 'The content of the note' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
