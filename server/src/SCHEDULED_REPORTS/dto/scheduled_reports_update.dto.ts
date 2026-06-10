import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateScheduledReportDto {
  @ApiPropertyOptional({ description: 'Name of the report to run' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  report_name?: string;

  @ApiPropertyOptional({ description: 'Array of email addresses' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recipients?: string[];

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'quarterly'] })
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly'])
  @IsOptional()
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  @ApiPropertyOptional({ description: 'Day of week (MON-SUN)' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  day_of_week?: string;

  @ApiPropertyOptional({ description: 'Day of month (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  @IsOptional()
  day_of_month?: number;

  @ApiPropertyOptional({ description: 'Time of day to send' })
  @IsString()
  @MaxLength(10)
  @IsOptional()
  send_time?: string;

  @ApiPropertyOptional({ enum: ['pdf', 'xlsx', 'csv'] })
  @IsEnum(['pdf', 'xlsx', 'csv'])
  @IsOptional()
  format?: 'pdf' | 'xlsx' | 'csv';

  @ApiPropertyOptional({ description: 'Is scheduled report active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Next run time' })
  @IsString()
  @IsOptional()
  next_run?: string;
}
