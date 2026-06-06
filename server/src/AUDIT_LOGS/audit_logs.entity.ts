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
  tableName: 'audit_logs',
  timestamps: false,
  underscored: true,
})
export class AuditLog extends Model {
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
  })
  user_id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  action: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  module: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  record_id: string | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  old_values: Record<string, unknown>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  new_values: Record<string, unknown>;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  ip_address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  user_agent: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
}
