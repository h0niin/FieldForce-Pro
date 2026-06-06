import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name', example: 'Work Order Status Webhook' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Webhook URL', example: 'https://example.com/webhooks/fsm' })
  @IsUrl()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({
    description: 'Events to subscribe to',
    example: ['work_order.created', 'work_order.status_changed'],
  })
  @IsArray()
  @IsOptional()
  events?: string[];

  @ApiPropertyOptional({ description: 'Webhook secret for signature verification', example: 'whsec_abc123' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({ description: 'Is webhook active', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
