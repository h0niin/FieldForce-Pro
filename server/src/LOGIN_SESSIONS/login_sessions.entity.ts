import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from 'sequelize-typescript';
import { User } from '../USERS/users.entity';

@Table({ tableName: 'login_sessions', timestamps: false, underscored: true })
export class LoginSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  refresh_token_hash: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  device_name: string;

  @Default('web')
  @Column({ type: DataType.ENUM('web', 'mobile', 'tablet', 'desktop'), allowNull: false })
  device_type: 'web' | 'mobile' | 'tablet' | 'desktop';

  @Column({ type: DataType.STRING(45), allowNull: true })
  ip_address: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  user_agent: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  os: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  browser: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  location: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  last_activity_at: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at: Date;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  created_at: Date;

  @BelongsTo(() => User)
  user: User;
}
