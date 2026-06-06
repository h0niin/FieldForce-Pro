import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BelongsToMany,
} from 'sequelize-typescript';
import { Role } from '../ROLES/roles.entity';
import { RolePermission } from '../ROLE_PERMISSION/role_permission.entity';

@Table({ tableName: 'permissions', timestamps: false, underscored: true })
export class Permission extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  name: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  module: string;

  @Column({
    type: DataType.ENUM('create', 'read', 'update', 'delete', 'manage'),
    allowNull: false,
  })
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';

  @Column({ type: DataType.STRING(500), allowNull: true })
  description: string;

  @BelongsToMany(() => Role, () => RolePermission)
  roles: Role[];
}
