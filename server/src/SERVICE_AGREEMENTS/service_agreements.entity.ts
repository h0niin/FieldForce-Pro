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
  tableName: 'service_agreements',
  timestamps: true,
  underscored: true,
})
export class ServiceAgreement extends Model {
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
    allowNull: true,
    comment: 'Reference to contact',
  })
  contact_id: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.ENUM('maintenance', 'warranty', 'sla'),
    allowNull: false,
  })
  type: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  start_date: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  end_date: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  recurrence: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  sla_response_hours: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  sla_resolution_hours: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  value: number;

  @Column({
    type: DataType.ENUM('draft', 'active', 'expired', 'cancelled', 'renewed'),
    allowNull: false,
    defaultValue: 'draft',
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

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
