import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../USERS/users.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';

@Table({ tableName: 'subscription_magic_links', timestamps: true, underscored: true })
export class SubscriptionMagicLink extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  token: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  token_hash: string;

  @ForeignKey(() => SubscriptionPlan)
  @Column({ type: DataType.UUID, allowNull: false })
  plan_id: string;

  @BelongsTo(() => SubscriptionPlan, 'plan_id')
  plan: SubscriptionPlan;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  created_by: string;

  @BelongsTo(() => User, 'created_by')
  creator: User;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'active' })
  status: string; // active | expired | used | disabled

  @Column({ type: DataType.DATE, allowNull: false })
  expires_at: Date;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  max_uses: number;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  used_count: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  updated_at: Date;
}
