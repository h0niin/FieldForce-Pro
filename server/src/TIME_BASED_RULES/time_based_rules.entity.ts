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
  tableName: 'time_based_rules',
  timestamps: true,
  underscored: true,
})
export class TimeBasedRule extends Model {
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
    type: DataType.STRING(50),
    allowNull: false,
  })
  module: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  date_field: string;

  @Column({
    type: DataType.ENUM('before', 'after', 'on'),
    allowNull: false,
    defaultValue: 'on',
  })
  offset_direction: 'before' | 'after' | 'on';

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  offset_value: number;

  @Column({
    type: DataType.ENUM('days', 'hours', 'weeks'),
    allowNull: false,
    defaultValue: 'days',
  })
  offset_unit: 'days' | 'hours' | 'weeks';

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  conditions: Record<string, unknown>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  actions: Record<string, unknown>;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_active: boolean;

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
