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
    comment: 'FK to users - assigned technician (null when unassigned)',
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
