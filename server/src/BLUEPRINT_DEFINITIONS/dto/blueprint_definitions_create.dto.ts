import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateBlueprintDefinitionDto {
  @ApiProperty({
    description: 'Blueprint name',
    example: 'Work Order Standard Flow',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Module this blueprint applies to',
    enum: ['work_order', 'estimate', 'invoice', 'service_request', 'service_appointment'],
  })
  @IsEnum(['work_order', 'estimate', 'invoice', 'service_request', 'service_appointment'])
  module: string;

  @ApiPropertyOptional({
    description: 'Whether the blueprint is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
