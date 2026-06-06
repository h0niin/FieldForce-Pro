import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class UpdatePaymentGatewayDto {
  @ApiPropertyOptional({
    description: 'Gateway name (e.g. stripe, razorpay)',
    example: 'stripe',
  })
  @IsString()
  @IsOptional()
  gateway_name?: string;

  @ApiPropertyOptional({
    description: 'Encrypted API key',
    example: 'sk_test_...',
  })
  @IsString()
  @IsOptional()
  api_key_encrypted?: string;

  @ApiPropertyOptional({
    description: 'Encrypted webhook secret',
    example: 'whsec_...',
  })
  @IsString()
  @IsOptional()
  webhook_secret_encrypted?: string;

  @ApiPropertyOptional({
    description: 'Whether the gateway is active',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the gateway is in test mode',
  })
  @IsBoolean()
  @IsOptional()
  is_test_mode?: boolean;

  @ApiPropertyOptional({
    description: 'Gateway-specific configuration (JSONB)',
    example: { currency: 'USD', capture_method: 'automatic' },
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
