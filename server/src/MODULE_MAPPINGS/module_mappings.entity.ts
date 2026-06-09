import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({
  tableName: 'module_mappings',
  timestamps: true,
  underscored: true,
})
export class ModuleMapping extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({ type: DataType.STRING(100), allowNull: false })
  source_module: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  target_module: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  source_field: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  target_field: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
