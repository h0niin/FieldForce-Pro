import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsToMany,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { RolePermission } from '../ROLE_PERMISSION/role_permission.entity';
import { User } from '../USERS/users.entity';
import { UserRole } from '../USER_ROLES/user_roles.entity';

@Table({ tableName: 'roles', timestamps: true, underscored: true })
export class Role extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  description: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_system: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions: Permission[];

  @BelongsToMany(() => User, () => UserRole)
  users: User[];
}
