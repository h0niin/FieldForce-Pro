import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateTerritoryDto {
  @ApiProperty({ description: 'Territory name', example: 'North Region' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Territory description', example: 'Covers northern service areas' })
  @IsString()
  @IsOptional()
  description?: string;
}
