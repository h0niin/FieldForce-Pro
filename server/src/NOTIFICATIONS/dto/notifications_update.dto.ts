import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsObject,
} from 'class-validator';

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Notification type', example: 'work_order_assigned' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Notification title', example: 'New Work Order Assigned' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Notification body', example: 'You have been assigned work order WO-1234' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    description: 'Additional data (JSONB)',
    example: { work_order_id: '550e8400-e29b-41d4-a716-446655440000' },
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Notification channel',
    enum: ['email', 'sms', 'push', 'in_app', 'whatsapp'],
  })
  @IsEnum(['email', 'sms', 'push', 'in_app', 'whatsapp'])
  @IsOptional()
  channel?: string;

  @ApiPropertyOptional({
    description: 'Whether the notification has been read',
  })
  @IsBoolean()
  @IsOptional()
  is_read?: boolean;

  @ApiPropertyOptional({
    description: 'Date when notification was sent',
    example: '2024-12-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  sent_at?: string;
}
