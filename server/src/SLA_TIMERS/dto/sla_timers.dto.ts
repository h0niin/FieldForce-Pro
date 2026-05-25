import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SlaTimerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenant_id: string;

  @ApiProperty()
  work_order_id: string;

  @ApiProperty()
  technician_id: string;

  @ApiProperty()
  session_id: string;

  @ApiProperty({ enum: ['acceptance', 'travel', 'on_site_prep', 'work_completion', 'total_resolution'] })
  timer_type: string;

  @ApiPropertyOptional()
  category: string;

  @ApiPropertyOptional()
  priority: string;

  @ApiProperty()
  started_at: Date;

  @ApiProperty()
  deadline_at: Date;

  @ApiPropertyOptional()
  paused_at: Date | null;

  @ApiProperty()
  total_paused_ms: number;

  @ApiPropertyOptional()
  completed_at: Date | null;

  @ApiPropertyOptional()
  actual_duration_ms: number | null;

  @ApiProperty()
  sla_duration_ms: number;

  @ApiProperty({ enum: ['historical_avg', 'default'] })
  source: string;

  @ApiProperty()
  sample_count: number;

  @ApiProperty({ enum: ['running', 'paused', 'warning', 'breached', 'completed_on_time', 'completed_late'] })
  status: string;

  @ApiProperty()
  warning_75_sent: boolean;

  @ApiProperty()
  warning_90_sent: boolean;

  @ApiProperty()
  breach_sent: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class SlaStatsResponseDto {
  @ApiProperty()
  total_timers: number;

  @ApiProperty()
  completed_on_time: number;

  @ApiProperty()
  completed_late: number;

  @ApiProperty()
  currently_running: number;

  @ApiProperty()
  currently_breached: number;

  @ApiProperty({ description: 'Compliance percentage (0-100)' })
  compliance_rate: number;

  @ApiProperty({ description: 'Average actual duration in ms across completed timers' })
  avg_actual_duration_ms: number;
}
