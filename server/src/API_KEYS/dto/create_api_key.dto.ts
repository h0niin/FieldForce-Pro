import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Bluestar Website Integration' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: ['service_requests:create'],
    description: 'Permission scopes this key is allowed to use',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @ApiPropertyOptional({
    example: '2027-01-01T00:00:00Z',
    description: 'Expiry date — omit for no expiry',
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
