import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAgentLocationDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Latitude', example: 37.7749295 })
  @IsNumber()
  lat: number;

  @ApiProperty({ description: 'Longitude', example: -122.4194155 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters', example: 10.5 })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Speed in km/h', example: 45.0 })
  @IsNumber()
  @IsOptional()
  speed?: number;

  @ApiPropertyOptional({ description: 'Compass heading in degrees', example: 180.0 })
  @IsNumber()
  @IsOptional()
  heading?: number;

  @ApiPropertyOptional({ description: 'Battery level 0-100', example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  battery_level?: number;

  @ApiProperty({ description: 'Time the location was recorded', example: '2025-01-15T09:00:00Z' })
  @IsDateString()
  recorded_at: string;
}

export class BatchCreateAgentLocationDto {
  @ApiProperty({
    description: 'Array of location entries',
    type: [CreateAgentLocationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAgentLocationDto)
  locations: CreateAgentLocationDto[];
}
