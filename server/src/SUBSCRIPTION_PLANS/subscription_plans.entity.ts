import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({ tableName: 'subscription_plans', timestamps: true, underscored: true })
export class SubscriptionPlan extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  max_technicians: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  max_dispatchers: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  max_managers: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  max_admins: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  max_total_users: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  max_appointments_monthly: number | null;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  price_monthly: number;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  price_yearly: number;

  @Default('USD')
  @Column({ type: DataType.STRING(10), allowNull: false })
  currency: string;


  @Default([])
  @Column({ type: DataType.JSONB, allowNull: false })
  features: string[];

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
