import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({
  tableName: 'timesheets',
  timestamps: true,
  underscored: true,
})
export class Timesheet extends Model {
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

  @Column({
    type: DataType.UUID,
    allowNull: false,
    comment: 'FK to users',
  })
  user_id: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to service_appointments',
  })
  appointment_id: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to work_orders',
  })
  work_order_id: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  clock_in: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  clock_out: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  travel_time_minutes: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  work_time_minutes: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  break_time_minutes: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_billable: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  })
  status: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  approved_by: string;

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
