import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateBlueprintTransitionDto {
  @ApiPropertyOptional({
    description: 'Blueprint definition ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  blueprint_id?: string;

  @ApiPropertyOptional({
    description: 'Source state ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  from_state_id?: string;

  @ApiPropertyOptional({
    description: 'Target state ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  @IsOptional()
  to_state_id?: string;

  @ApiPropertyOptional({
    description: 'Transition name',
    example: 'Start Work',
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Roles allowed to perform this transition',
    example: ['admin', 'technician'],
  })
  @IsArray()
  @IsOptional()
  allowed_roles?: string[];

  @ApiPropertyOptional({
    description: 'Fields required before this transition can occur',
    example: ['assigned_to', 'scheduled_date'],
  })
  @IsArray()
  @IsOptional()
  required_fields?: string[];

  @ApiPropertyOptional({
    description: 'Webhook URL to call on transition',
    example: 'https://api.example.com/webhooks/transition',
  })
  @IsUrl()
  @IsOptional()
  webhook_url?: string;

  @ApiPropertyOptional({
    description: 'Guard condition expression',
    example: 'entity.total > 0',
  })
  @IsString()
  @IsOptional()
  guard_condition?: string;
}
