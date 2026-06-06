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
  tableName: 'job_sheet_items',
  timestamps: true,
  underscored: true,
})
export class JobSheetItem extends Model {
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

  // FK to job_sheet_instances
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  instance_id: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: false,
  })
  label: string;

  @Column({
    type: DataType.ENUM('checkbox', 'text', 'photo', 'signature', 'number', 'date'),
    allowNull: false,
    defaultValue: 'checkbox',
  })
  type: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  value: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  photo_url: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_required: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  sort_order: number;

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
