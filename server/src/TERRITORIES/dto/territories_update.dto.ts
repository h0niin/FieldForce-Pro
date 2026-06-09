import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTerritoryDto {
  @ApiPropertyOptional({ description: 'Territory name', example: 'North Region' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Territory description', example: 'Covers northern service areas' })
  @IsString()
  @IsOptional()
  description?: string;
}
