import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, IsArray } from 'class-validator';

/**
 * Generic inbound email webhook payload.
 * Works with SendGrid Inbound Parse, Mailgun, or custom forwarding services.
 */
export class InboundEmailPayload {
  @ApiPropertyOptional({ description: 'Sender email address (e.g. "Sara <sara@acme.com>")', example: 'sara@acme.com' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'Recipient email address', example: 'support@fieldforce.com' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Email subject line', example: 'Printer not working' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Plain text body of the email' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML body of the email' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({ description: 'Sender name (parsed from From header)' })
  @IsOptional()
  @IsString()
  sender_name?: string;

  @ApiPropertyOptional({ description: 'Sender email only (parsed)', example: 'sara@acme.com' })
  @IsOptional()
  @IsString()
  sender_email?: string;

  @ApiPropertyOptional({ description: 'Email Message-ID header' })
  @IsOptional()
  @IsString()
  message_id?: string;

  @ApiPropertyOptional({ description: 'In-Reply-To header (for threading)' })
  @IsOptional()
  @IsString()
  in_reply_to?: string;

  @ApiPropertyOptional({ description: 'References header (for threading)' })
  @IsOptional()
  @IsString()
  references?: string;

  @ApiPropertyOptional({ description: 'Email date header' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Attachments metadata',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string;
    content_type: string;
    size?: number;
    content?: string; // base64 encoded
  }>;

  @ApiPropertyOptional({ description: 'Raw email headers as JSON' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ description: 'SPF check result' })
  @IsOptional()
  @IsString()
  SPF?: string;

  @ApiPropertyOptional({ description: 'DKIM check result' })
  @IsOptional()
  @IsString()
  dkim?: string;

  @ApiPropertyOptional({ description: 'Spam score from provider' })
  @IsOptional()
  @IsString()
  spam_score?: string;

  @ApiPropertyOptional({ description: 'Spam report from provider' })
  @IsOptional()
  @IsString()
  spam_report?: string;

  @ApiPropertyOptional({ description: 'Full envelope JSON from SendGrid' })
  @IsOptional()
  @IsString()
  envelope?: string;
}
