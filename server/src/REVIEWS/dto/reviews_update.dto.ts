import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ReviewPlatform } from '../reviews.entity';

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'Rating (1-5)', example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Review comment', example: 'Good service overall.' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Review platform',
    enum: ReviewPlatform,
    example: ReviewPlatform.INTERNAL,
  })
  @IsEnum(ReviewPlatform)
  @IsOptional()
  platform?: ReviewPlatform;
}
