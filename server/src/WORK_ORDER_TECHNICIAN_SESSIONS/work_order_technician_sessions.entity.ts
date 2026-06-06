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

export enum TechnicianSessionStep {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  TRIP_STARTED = 'trip_started',
  REACHED = 'reached',
  ITEMS_CONFIRMED = 'items_confirmed',
  CALL_CONFIRMED = 'call_confirmed',
  WORK_STARTED = 'work_started',
  PAUSED = 'paused',
  AFTER_PHOTOS = 'after_photos',
  FEEDBACK_COLLECTED = 'feedback_collected',
  FINISHED = 'finished',
}

@Table({
  tableName: 'work_order_technician_sessions',
  timestamps: true,
  underscored: true,
})
export class WorkOrderTechnicianSession extends Model {
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
    unique: true,
    comment: 'One session per work order',
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

  @Column({
    type: DataType.ENUM(
      'pending_approval',
      'approved',
      'rejected',
      'trip_started',
      'reached',
      'items_confirmed',
      'call_confirmed',
      'work_started',
      'paused',
      'after_photos',
      'feedback_collected',
      'finished',
    ),
    allowNull: false,
    defaultValue: 'pending_approval',
  })
  step: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  rejection_reason: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approved_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  rejected_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  trip_started_at: Date;

  @Column({
    type: DataType.ENUM('manual', 'auto_gps'),
    allowNull: true,
  })
  trip_start_type: string;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: true,
  })
  trip_start_lat: number;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: true,
  })
  trip_start_lng: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  reached_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  items_confirmed_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  call_confirmed_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  work_started_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  paused_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resumed_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  before_photos_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  after_photos_at: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Customer rating 1-5',
  })
  customer_rating: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  customer_feedback: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Base64 or URL of customer signature',
  })
  customer_signature_url: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  finished_at: Date;

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
