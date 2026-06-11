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
  tableName: 'automation_actions',
  timestamps: true,
  underscored: true,
})
export class AutomationAction extends Model {
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
    type: DataType.STRING(200),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string | null;

  @Column({
    type: DataType.ENUM('email', 'update_field', 'create_record', 'notification', 'webhook'),
    allowNull: false,
  })
  type: 'email' | 'update_field' | 'create_record' | 'notification' | 'webhook';

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  config: Record<string, unknown>;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_enabled: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  usages: number;

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
