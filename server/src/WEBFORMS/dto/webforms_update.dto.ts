import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';

export class UpdateWebformDto {
  @ApiPropertyOptional({ description: 'Webform name', example: 'Service Request Form' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Form fields definition (JSONB)',
    example: [{ name: 'email', type: 'text', required: true }],
  })
  @IsArray()
  @IsOptional()
  fields?: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: 'Form styling configuration (JSONB)',
    example: { theme: 'light', primaryColor: '#1890ff' },
  })
  @IsObject()
  @IsOptional()
  styling?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Redirect URL after form submission',
    example: 'https://example.com/thank-you',
  })
  @IsString()
  @IsOptional()
  redirect_url?: string;

  @ApiPropertyOptional({
    description: 'Whether the webform is active',
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'HTML embed code for the webform',
    example: '<iframe src="..."></iframe>',
  })
  @IsString()
  @IsOptional()
  embed_code?: string;
}
