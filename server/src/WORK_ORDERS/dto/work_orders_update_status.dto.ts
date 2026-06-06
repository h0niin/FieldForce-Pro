import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({
    description: 'New status for the work order',
    enum: ['new', 'estimated', 'approved', 'scheduled', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled'],
  })
  @IsEnum(['new', 'estimated', 'approved', 'scheduled', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled'])
  status: string;
}
