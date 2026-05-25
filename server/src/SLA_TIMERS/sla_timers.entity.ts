import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';

export enum SlaTimerStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  WARNING = 'warning',
  BREACHED = 'breached',
  COMPLETED_ON_TIME = 'completed_on_time',
  COMPLETED_LATE = 'completed_late',
}

export enum SlaTimerType {
  ACCEPTANCE = 'acceptance',
  TRAVEL = 'travel',
  ON_SITE_PREP = 'on_site_prep',
  WORK_COMPLETION = 'work_completion',
  TOTAL_RESOLUTION = 'total_resolution',
}

export enum SlaTimerSource {
  HISTORICAL_AVG = 'historical_avg',
  DEFAULT = 'default',
}

@Table({
  tableName: 'sla_timers',
  timestamps: true,
  underscored: true,
})
export class SlaTimer extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => WorkOrder)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  work_order_id: string;

  @BelongsTo(() => WorkOrder)
  work_order: WorkOrder;

  @Column({
    type: DataType.UUID,
    allowNull: false,
    comment: 'FK to users — assigned technician',
  })
  technician_id: string;

  @ForeignKey(() => WorkOrderTechnicianSession)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    comment: 'FK to work_order_technician_sessions',
  })
  session_id: string;

  @BelongsTo(() => WorkOrderTechnicianSession)
  session: WorkOrderTechnicianSession;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'work_completion',
  })
  timer_type: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: 'WO category used for historical lookup',
  })
  category: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: 'WO priority used for historical lookup',
  })
  priority: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: 'When the SLA clock started (technician accepted)',
  })
  started_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: 'Calculated deadline',
  })
  deadline_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When the timer was last paused (null if not paused)',
  })
  paused_at: Date;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total accumulated pause time in milliseconds',
  })
  total_paused_ms: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When work was completed',
  })
  completed_at: Date;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
    comment: 'Actual working time in ms (total elapsed minus pauses)',
  })
  actual_duration_ms: number;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    comment: 'Allocated SLA time in milliseconds',
  })
  sla_duration_ms: number;

  @Column({
    type: DataType.ENUM('historical_avg', 'default'),
    allowNull: false,
    comment: 'How the deadline was calculated',
  })
  source: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of historical records used for calculation',
  })
  sample_count: number;

  @Column({
    type: DataType.ENUM(
      'running',
      'paused',
      'warning',
      'breached',
      'completed_on_time',
      'completed_late',
    ),
    allowNull: false,
    defaultValue: 'running',
  })
  status: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '75% threshold notification sent',
  })
  warning_75_sent: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: '90% threshold notification sent',
  })
  warning_90_sent: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: 'Breach notification sent',
  })
  breach_sent: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updated_at: Date;
}
