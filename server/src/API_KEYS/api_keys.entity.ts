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
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({ tableName: 'api_keys', timestamps: true, underscored: true })
export class ApiKey extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  // First 12 chars of the raw key — safe to display in UI
  @Column({ type: DataType.STRING(20), allowNull: false })
  key_prefix: string;

  // bcrypt hash of the full raw key — never returned to callers
  @Column({ type: DataType.STRING(255), allowNull: false })
  key_hash: string;

  // Array of permission scopes, e.g. ['service_requests:create']
  @Default([])
  @Column({ type: DataType.JSONB, allowNull: false })
  scopes: string[];

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  is_active: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  last_used_at: Date;

  // null = never expires
  @Column({ type: DataType.DATE, allowNull: true })
  expires_at: Date;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  is_deleted: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
