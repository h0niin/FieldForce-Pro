import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class UpdateCommunicationDto {
  @ApiPropertyOptional({
    description: 'Contact ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  contact_id?: string;

  @ApiPropertyOptional({
    description: 'Communication channel',
    enum: ['email', 'sms', 'whatsapp', 'in_app'],
  })
  @IsEnum(['email', 'sms', 'whatsapp', 'in_app'])
  @IsOptional()
  channel?: string;

  @ApiPropertyOptional({
    description: 'Communication direction',
    enum: ['inbound', 'outbound'],
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

  @ApiPropertyOptional({
    description: 'Body of the communication',
    example: 'Your work order WO-1234 has been completed.',
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    description: 'Communication status',
    enum: ['draft', 'sent', 'delivered', 'failed'],
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
