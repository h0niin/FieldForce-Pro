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
  tableName: 'module_mappings',
  timestamps: true,
  underscored: true,
})
export class ModuleMapping extends Model {
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
    type: DataType.STRING(100),
    allowNull: false,
  })
  source_module: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  target_module: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  field_mappings: Record<string, any>[];

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  created_by: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  updated_by: string;

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
