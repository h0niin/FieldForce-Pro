import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class CreateCommunicationDto {
  @ApiProperty({
    description: 'Contact ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  contact_id: string;

  @ApiPropertyOptional({
    description: 'Communication channel',
    enum: ['email', 'sms', 'whatsapp', 'in_app'],
    default: 'email',
  })
  @IsEnum(['email', 'sms', 'whatsapp', 'in_app'])
  @IsOptional()
  channel?: string;

  @ApiPropertyOptional({
    description: 'Communication direction',
    enum: ['inbound', 'outbound'],
    default: 'outbound',
  })
  @IsEnum(['inbound', 'outbound'])
  @IsOptional()
  direction?: string;

  @ApiPropertyOptional({
    description: 'Subject of the communication',
    example: 'Work Order Update',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Body of the communication',
    example: 'Your work order WO-1234 has been completed.',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Communication status',
    enum: ['draft', 'sent', 'delivered', 'failed'],
    default: 'draft',
  })
  @IsEnum(['draft', 'sent', 'delivered', 'failed'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Date when the communication was sent',
    example: '2024-12-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  sent_at?: string;
}
