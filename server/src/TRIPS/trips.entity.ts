import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';

@Table({
  tableName: 'trips',
  timestamps: true,
  underscored: true,
})
export class Trip extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    comment: 'FK to users',
  })
  user_id: string;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to service_appointments',
  })
  appointment_id: string;

  @ForeignKey(() => WorkOrder)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to work_orders',
  })
  work_order_id: string;

  @BelongsTo(() => WorkOrder)
  work_order: WorkOrder;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: false,
  })
  start_lat: number;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: false,
  })
  start_lng: number;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: true,
  })
  end_lat: number;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: true,
  })
  end_lng: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  start_time: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end_time: Date;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  distance_km: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Encoded polyline for route visualization',
  })
  route_polyline: string;

  @Column({
    type: DataType.ENUM('in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'in_progress',
  })
  status: string;

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
