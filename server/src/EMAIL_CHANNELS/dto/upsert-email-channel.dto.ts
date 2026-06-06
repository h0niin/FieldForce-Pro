import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertEmailChannelDto {
  @ApiProperty({ enum: ['forwarding', 'mailbox', 'platform_provided'] })
  @IsEnum(['forwarding', 'mailbox', 'platform_provided'])
  connection_method: string;

  @ApiPropertyOptional({ description: 'The support email address customers will email' })
  @IsOptional()
  @IsString()
  support_email?: string;

  @ApiPropertyOptional({ description: 'Platform-issued forwarding address' })
  @IsOptional()
  @IsString()
  platform_email?: string;

  @ApiPropertyOptional({ description: 'Reply sender name customers see' })
  @IsOptional()
  @IsString()
  reply_from_name?: string;

  @ApiPropertyOptional({ description: 'Reply-from email address' })
  @IsOptional()
  @IsString()
  reply_from_email?: string;

  @ApiPropertyOptional({ description: 'Acknowledgement email template (supports {ticket_number}, {summary}, {category} placeholders)' })
  @IsOptional()
  @IsString()
  acknowledgement_template?: string;

  @ApiPropertyOptional({ description: 'Clarification email template (supports {ticket_number} placeholder)' })
  @IsOptional()
  @IsString()
  clarification_template?: string;

  @ApiPropertyOptional({ description: 'Categories the AI may assign' })
  @IsOptional()
  @IsArray()
  category_mapping?: string[];

  @ApiPropertyOptional({ description: 'Priority rules: keyword → priority mappings' })
  @IsOptional()
  @IsObject()
  priority_rules?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Default category when AI is unsure' })
  @IsOptional()
  @IsString()
  default_category?: string;

  @ApiPropertyOptional({ description: 'Default priority when AI cannot infer' })
  @IsOptional()
  @IsString()
  default_priority?: string;

  @ApiPropertyOptional({ description: 'Allowed sender domains/emails' })
  @IsOptional()
  @IsArray()
  allowed_senders?: string[];

  @ApiPropertyOptional({ description: 'Blocked sender patterns' })
  @IsOptional()
  @IsArray()
  blocked_senders?: string[];

  @ApiPropertyOptional({ description: 'Enable spam/auto-reply filtering' })
  @IsOptional()
  @IsBoolean()
  spam_filter_enabled?: boolean;

  @ApiPropertyOptional({ description: 'Keywords triggering human review' })
  @IsOptional()
  @IsArray()
  human_handoff_keywords?: string[];

  @ApiPropertyOptional({ description: 'Team/queue for sensitive emails' })
  @IsOptional()
  @IsString()
  handoff_team?: string;

  @ApiPropertyOptional({ description: 'Activate or deactivate the email channel' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'IMAP connection config (for mailbox method)' })
  @IsOptional()
  @IsObject()
  imap_config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'SMTP config for outbound replies' })
  @IsOptional()
  @IsObject()
  smtp_config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Secret for validating inbound webhooks' })
  @IsOptional()
  @IsString()
  webhook_secret?: string;
}
