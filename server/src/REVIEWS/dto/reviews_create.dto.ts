import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, IsEnum, Min, Max } from 'class-validator';
import { ReviewPlatform } from '../reviews.entity';

export class CreateReviewDto {
  @ApiProperty({ description: 'Work order ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  work_order_id: string;

  @ApiPropertyOptional({ description: 'Contact (customer) ID', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiProperty({ description: 'Rating (1-5)', example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Review comment', example: 'Excellent service, very professional!' })
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
