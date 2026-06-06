import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TechnicianSessionRejectDto {
  @ApiProperty({ description: 'Reason for rejecting the work order', example: 'Outside my service area' })
  @IsString()
  @MinLength(1)
  reason: string;
}
