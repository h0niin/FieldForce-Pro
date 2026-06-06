import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class UpdateBlueprintDefinitionDto {
  @ApiPropertyOptional({
    description: 'Blueprint name',
    example: 'Work Order Standard Flow',
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Module this blueprint applies to',
    enum: ['work_order', 'estimate', 'invoice', 'service_request', 'service_appointment'],
  })
  @IsEnum(['work_order', 'estimate', 'invoice', 'service_request', 'service_appointment'])
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({
    description: 'Whether the blueprint is active',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
