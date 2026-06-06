import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../USERS/users.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';

@Table({ tableName: 'tenants', timestamps: true, underscored: true })
export class Tenant extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  slug: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  domain: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  logo_url: string;

  @Default({})
  @Column({ type: DataType.JSONB, allowNull: false })
  settings: Record<string, unknown>;

  @Default('free')
  @Column({ type: DataType.STRING(50), allowNull: false })
  subscription_plan: string;

  @Default(5)
  @Column({ type: DataType.INTEGER, allowNull: false })
  max_users: number;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  // ── Subscription Plan (Part 1) ──────────────────────────────────────────
  @ForeignKey(() => SubscriptionPlan)
  @Column({ type: DataType.UUID, allowNull: true })
  subscription_plan_id: string | null;

  @BelongsTo(() => SubscriptionPlan, { as: 'plan' })
  plan: SubscriptionPlan;

  @Default('trial')
  @Column({ type: DataType.STRING(20), allowNull: false })
  subscription_status: string;

  @Column({ type: DataType.DATE, allowNull: true })
  subscription_start: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  subscription_end: Date | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  custom_limits: Record<string, number | null> | null;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @HasMany(() => User)
  users: User[];
}
