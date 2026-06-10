import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateScheduledReportDto {
  @ApiProperty({ description: 'Name of the report to run', example: 'Work Order Summary' })
  @IsString()
  @MaxLength(200)
  report_name: string;

  @ApiProperty({ description: 'Array of email addresses', example: ['admin@example.com'] })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'quarterly'] })
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly'])
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  @ApiPropertyOptional({ description: 'Day of week (MON-SUN)', example: 'MON' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  day_of_week?: string;

  @ApiPropertyOptional({ description: 'Day of month (1-31)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  day_of_month?: number;

  @ApiProperty({ description: 'Time of day to send', example: '09:00' })
  @IsString()
  @MaxLength(10)
  send_time: string;

  @ApiPropertyOptional({ enum: ['pdf', 'xlsx', 'csv'], default: 'pdf' })
  @IsEnum(['pdf', 'xlsx', 'csv'])
  @IsOptional()
  format?: 'pdf' | 'xlsx' | 'csv';

  @ApiPropertyOptional({ description: 'Is scheduled report active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Next run time' })
  @IsString()
  @IsOptional()
  next_run?: string;
}
