import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveDispatchConsoleLayoutDto {
  @ApiProperty({ example: 'gantt', description: 'View type: gantt, grid, or calendar' })
  @IsString()
  @IsNotEmpty()
  view_type: string;

  @ApiProperty({ example: 'classic', description: 'Layout mode: classic, compact, or comfortable' })
  @IsString()
  @IsNotEmpty()
  layout_mode: string;

  @ApiProperty({ example: ['subject', 'status', 'scheduled_date'], description: 'List of visible fields in order' })
  @IsArray()
  @IsString({ each: true })
  visible_fields: string[];
}
