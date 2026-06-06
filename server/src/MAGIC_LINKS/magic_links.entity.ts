import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../USERS/users.entity';

@Table({ tableName: 'magic_links', timestamps: false, underscored: true })
export class MagicLink extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id: string;

  @BelongsTo(() => User, 'user_id')
  user: User;

  @Column({ type: DataType.STRING(255), allowNull: false })
  token_hash: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  purpose: 'super_admin_access' | 'admin_onboarding' | 'user_access' | 'user_onboarding';

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  is_used: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  created_by: string;

  @CreatedAt
  created_at: Date;
}
