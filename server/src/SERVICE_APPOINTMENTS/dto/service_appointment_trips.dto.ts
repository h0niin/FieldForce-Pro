import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class CreateServiceAppointmentTripDto {
  @ApiProperty({ description: 'Trip date (YYYY-MM-DD)', example: '2025-01-15' })
  @IsDateString()
  trip_date: string;

  @ApiProperty({ description: 'Start location', example: 'Warehouse, MG Road' })
  @IsString()
  @MaxLength(300)
  start_location: string;

  @ApiProperty({ description: 'End location', example: 'Customer site, Indiranagar' })
  @IsString()
  @MaxLength(300)
  end_location: string;

  @ApiPropertyOptional({ description: 'Departure time', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  departure_time?: string;

  @ApiPropertyOptional({ description: 'Arrival time', example: '2025-01-15T09:45:00Z' })
  @IsDateString()
  @IsOptional()
  arrival_time?: string;

  @ApiPropertyOptional({ description: 'Distance travelled in km', example: 12.5 })
  @IsNumber()
  @IsOptional()
  distance_km?: number;

  @ApiPropertyOptional({ description: 'Trip notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateServiceAppointmentTripDto {
  @ApiPropertyOptional({ description: 'Trip date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  trip_date?: string;

  @ApiPropertyOptional({ description: 'Start location' })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  start_location?: string;

  @ApiPropertyOptional({ description: 'End location' })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  end_location?: string;

  @ApiPropertyOptional({ description: 'Departure time' })
  @IsDateString()
  @IsOptional()
  departure_time?: string;

  @ApiPropertyOptional({ description: 'Arrival time' })
  @IsDateString()
  @IsOptional()
  arrival_time?: string;

  @ApiPropertyOptional({ description: 'Distance travelled in km' })
  @IsNumber()
  @IsOptional()
  distance_km?: number;

  @ApiPropertyOptional({ description: 'Trip notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
