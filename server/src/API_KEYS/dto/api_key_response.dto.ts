import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() tenant_id: string;
  @ApiProperty() name: string;
  @ApiProperty({ description: 'Safe prefix — full key is never returned after creation' })
  key_prefix: string;
  @ApiProperty() scopes: string[];
  @ApiProperty() is_active: boolean;
  @ApiPropertyOptional() last_used_at: Date | null;
  @ApiPropertyOptional() expires_at: Date | null;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

export class CreateApiKeyResponseDto extends ApiKeyResponseDto {
  @ApiProperty({
    description: 'Raw API key — shown ONCE at creation, never again. Store it securely.',
    example: 'fk_live_a1b2c3d4e5f6...',
  })
  raw_key: string;
}
