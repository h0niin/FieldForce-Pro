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
import { User } from '../USERS/users.entity';
import { Asset } from '../ASSETS/assets.entity';

@Table({
  tableName: 'service_appointments',
  timestamps: true,
  underscored: true,
})
export class ServiceAppointment extends Model {
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
    comment: 'FK to work_orders',
  })
  work_order_id: string;

  @BelongsTo(() => WorkOrder)
  work_order: WorkOrder;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to users - assigned technician / service resource (null when unassigned)',
  })
  agent_id: string;

  @BelongsTo(() => User, 'agent_id')
  agent: User;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to crews',
  })
  crew_id: string;

  @ForeignKey(() => Asset)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  asset_id: string;

  @BelongsTo(() => Asset)
  asset: Asset;

  // ── Service Appointments module (web) — additive fields ──
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'Auto-generated appointment number, format AP-1, AP-2',
  })
  appointment_number: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  summary: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    defaultValue: 'Service',
    comment: 'Service | Installation | Maintenance | Inspection',
  })
  type: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: 'time_bound',
    comment: 'time_bound | all_day',
  })
  schedule_type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Auto-calculated from scheduled start/end, stored as seconds',
  })
  scheduled_duration: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Auto-calculated from actual start/end, stored as seconds',
  })
  actual_duration: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  due_date: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: 'not_invoiced',
    comment: 'not_invoiced | invoiced',
  })
  billing_status: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    comment: 'Preferred date 1 pulled from the linked service request',
  })
  preferred_date_1: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    comment: 'Preferred date 2 pulled from the linked service request',
  })
  preferred_date_2: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: 'Preferred time pulled from the linked service request',
  })
  preferred_time: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to users - who created the appointment',
  })
  created_by: string;

  @BelongsTo(() => User, 'created_by')
  creator: User;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'scheduled',
  })
  status: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  scheduled_start: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  scheduled_end: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  actual_start: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  actual_end: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  signature_url: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  photos: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_recurring: boolean;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: 'iCalendar RRULE format',
  })
  recurrence_rule: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  custom_fields: Record<string, unknown>;

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
