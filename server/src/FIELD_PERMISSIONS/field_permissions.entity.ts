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
import { Role } from '../ROLES/roles.entity';

export type FieldPermissionAccess = 'none' | 'read' | 'read_write';

@Table({
  tableName: 'field_permissions',
  timestamps: true,
  underscored: true,
})
export class FieldPermission extends Model {
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

  @Column({ type: DataType.STRING(100), allowNull: false })
  field_name: string;

  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, allowNull: false })
  role_id: string;

  @BelongsTo(() => Role)
  role: Role;

  @Default('read_write')
  @Column(DataType.ENUM('none', 'read', 'read_write'))
  access_level: FieldPermissionAccess;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
