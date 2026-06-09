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
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'tenant_modules',
  timestamps: true,
  underscored: true,
})
export class TenantModule extends Model {
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
  module_name: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  last_modified_by: string;

  @BelongsTo(() => User, 'last_modified_by')
  modifier: User;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
