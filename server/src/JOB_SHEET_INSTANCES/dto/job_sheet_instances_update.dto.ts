import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsEnum, IsObject, IsDateString } from 'class-validator';

export class UpdateJobSheetInstanceDto {
  @ApiPropertyOptional({ description: 'Template ID (FK to job_sheet_templates)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  template_id?: string;

  @ApiPropertyOptional({ description: 'Appointment ID (FK to service_appointments)', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  appointment_id?: string;

  @ApiPropertyOptional({ description: 'Work order ID (FK to work_orders)', example: '550e8400-e29b-41d4-a716-446655440002' })
  @IsUUID()
  @IsOptional()
  work_order_id?: string;

  @ApiPropertyOptional({
    description: 'Instance status',
    enum: ['draft', 'pending', 'approved', 'in_progress', 'completed'],
    example: 'in_progress',
  })
  @IsEnum(['draft', 'pending', 'approved', 'in_progress', 'completed'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'User ID who completed the instance', example: '550e8400-e29b-41d4-a716-446655440003' })
  @IsUUID()
  @IsOptional()
  completed_by?: string;

  @ApiPropertyOptional({ description: 'Completion date', example: '2024-06-15T10:30:00Z' })
  @IsDateString()
  @IsOptional()
  completed_at?: string;

  @ApiPropertyOptional({
    description: 'Custom fields (JSONB)',
    example: { notes: 'Field inspection completed' },
  })
  @IsObject()
  @IsOptional()
  custom_fields?: Record<string, unknown>;
}
