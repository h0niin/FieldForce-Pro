import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TechnicianSessionFinishDto {
  @ApiPropertyOptional({ description: 'Customer rating 1-5', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  customer_rating?: number;

  @ApiPropertyOptional({ description: 'Customer feedback text', example: 'Great service!' })
  @IsString()
  @IsOptional()
  customer_feedback?: string;

  @ApiPropertyOptional({ description: 'Customer signature as base64 data URL or uploaded URL' })
  @IsString()
  @IsOptional()
  customer_signature_url?: string;
}
