import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../USERS/users.entity';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({
  tableName: 'chatbot_sessions',
  timestamps: true,
})
export class ChatbotSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @ForeignKey(() => Tenant)
  @Column(DataType.UUID)
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id: string;

  @BelongsTo(() => User)
  user: User;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  session_type: string; // 'internal' | 'customer_portal'

  @Default('active')
  @Column(DataType.ENUM('active', 'closed', 'archived'))
  status: string;

  @Column(DataType.STRING(200))
  title: string;

  @Default(0)
  @Column(DataType.INTEGER)
  message_count: number;

  @Column(DataType.JSONB)
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    sources?: any[];
  }>;

  @Column(DataType.JSONB)
  context: Record<string, any>;

  @Column(DataType.JSONB)
  metadata: Record<string, any>;

  @Column(DataType.DATE)
  last_message_at: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_deleted: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  created_at: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at: Date;
}
