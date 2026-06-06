import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  MaxLength,
} from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty({
    description: 'Setting value (JSONB)',
    example: { enabled: true, threshold: 50 },
  })
  @IsObject()
  value: Record<string, unknown>;

  @ApiProperty({
    description: 'Setting category',
    example: 'general',
  })
  @IsString()
  @MaxLength(50)
  category: string;
}
