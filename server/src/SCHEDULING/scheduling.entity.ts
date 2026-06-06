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

/**
 * Entity for storing scheduling optimization results and metadata
 * Used for caching optimization results and tracking scheduling history
 */
@Table({
  tableName: 'scheduling_optimizations',
  timestamps: true,
})
export class SCHEDULING extends Model {
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

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  created_by: string;

  @BelongsTo(() => User)
  creator: User;

  @AllowNull(false)
  @Column(DataType.ENUM('vrp', 'demand_forecast', 'realtime', 'recommendation'))
  optimization_type: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  optimization_date: Date;

  @Column(DataType.DATE)
  start_date: Date;

  @Column(DataType.DATE)
  end_date: Date;

  @AllowNull(false)
  @Column(DataType.JSONB)
  input_parameters: any;

  @Column(DataType.JSONB)
  optimization_result: any;

  @Column(DataType.FLOAT)
  optimization_score: number;

  @Column(DataType.INTEGER)
  total_jobs: number;

  @Column(DataType.INTEGER)
  assigned_jobs: number;

  @Column(DataType.INTEGER)
  unassigned_jobs: number;

  @Column(DataType.FLOAT)
  total_distance_km: number;

  @Column(DataType.FLOAT)
  total_duration_minutes: number;

  @Column(DataType.FLOAT)
  execution_time_seconds: number;

  @Column(DataType.ENUM('pending', 'processing', 'completed', 'failed'))
  status: string;

  @Column(DataType.TEXT)
  error_message: string;

  @Column(DataType.JSONB)
  metadata: any;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_applied: boolean;

  @Column(DataType.DATE)
  applied_at: Date;

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