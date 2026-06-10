import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateServiceAppointmentNoteDto {
  @ApiProperty({ description: 'Note content', example: 'Customer requested a call before arrival.' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
