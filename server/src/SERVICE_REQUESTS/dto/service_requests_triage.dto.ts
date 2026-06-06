import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsArray } from 'class-validator';

export class TriageServiceRequestDto {
  @ApiProperty({
    description: 'New status for the service request',
    enum: ['new', 'triaged', 'estimated', 'approved', 'converted_to_wo', 'closed', 'spam'],
    example: 'triaged',
  })
  @IsEnum(['new', 'triaged', 'estimated', 'approved', 'converted_to_wo', 'closed', 'spam'])
  status: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['low', 'medium', 'high', 'urgent'],
    example: 'high',
  })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Category', example: 'HVAC' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Assigned user ID', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'List of assigned technician user IDs', type: [String], example: ['uuid1', 'uuid2'] })
  @IsUUID('4', { each: true })
  @IsArray()
  @IsOptional()
  technician_ids?: string[];
}
