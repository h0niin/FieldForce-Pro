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

@Table({
  tableName: 'work_order_attachments',
  timestamps: true,
  underscored: true,
})
export class WorkOrderAttachment extends Model {
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
    allowNull: true,
    comment: 'FK to users',
  })
  user_id: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  file_url: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  file_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  file_type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'File size in bytes',
  })
  file_size: number;

  @Column({
    type: DataType.ENUM('general', 'before_work', 'after_work'),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Type of photo for field workflow',
  })
  photo_type: string;

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
