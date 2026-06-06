import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional } from 'class-validator';

export class TechnicianSessionTripDto {
  @ApiProperty({ description: 'Starting latitude', example: 37.7749295 })
  @IsNumber()
  start_lat: number;

  @ApiProperty({ description: 'Starting longitude', example: -122.4194155 })
  @IsNumber()
  start_lng: number;

  @ApiPropertyOptional({
    description: 'How the trip was started',
    enum: ['manual', 'auto_gps'],
    default: 'manual',
  })
  @IsEnum(['manual', 'auto_gps'])
  @IsOptional()
  trip_start_type?: string;
}
