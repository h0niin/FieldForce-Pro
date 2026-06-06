import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Notification type', example: 'work_order_assigned' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Notification title', example: 'New Work Order Assigned' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body', example: 'You have been assigned work order WO-1234' })
  @IsString()
  body: string;

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
    default: 'in_app',
  })
  @IsEnum(['email', 'sms', 'push', 'in_app', 'whatsapp'])
  @IsOptional()
  channel?: string;

  @ApiPropertyOptional({
    description: 'Whether the notification has been read',
    default: false,
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
