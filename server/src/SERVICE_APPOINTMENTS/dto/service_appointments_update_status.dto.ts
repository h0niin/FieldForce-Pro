import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const VALID_STATUSES = [
  'scheduled',
  'en_route',
  'on_site',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;

export class UpdateServiceAppointmentStatusDto {
  @ApiProperty({
    description: 'New status for the service appointment',
    enum: VALID_STATUSES,
  })
  @IsEnum(VALID_STATUSES)
  status: string;
}
