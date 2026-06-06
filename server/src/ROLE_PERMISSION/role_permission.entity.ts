import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
} from 'sequelize-typescript';
import { Role } from '../ROLES/roles.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';

@Table({ tableName: 'role_permissions', timestamps: false, underscored: true })
export class RolePermission extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Role)
  @Column({ type: DataType.UUID, allowNull: false })
  role_id: string;

  @ForeignKey(() => Permission)
  @Column({ type: DataType.UUID, allowNull: false })
  permission_id: string;
}
