import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Asset } from '../ASSETS/assets.entity';

@Table({
  tableName: 'asset_maintenance_plans',
  timestamps: true,
  underscored: true,
})
export class AssetMaintenancePlan extends Model {
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

  @ForeignKey(() => Asset)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  asset_id: string;

  @BelongsTo(() => Asset)
  asset: Asset;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly',
  })
  frequency: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  next_due_date: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  last_completed_date: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  auto_create_wo: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_active: boolean;

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
