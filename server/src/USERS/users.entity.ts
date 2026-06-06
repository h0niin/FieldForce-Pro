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
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { UserRole } from '../USER_ROLES/user_roles.entity';
import { Role } from '../ROLES/roles.entity';
import { LoginSession } from '../LOGIN_SESSIONS/login_sessions.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { ServiceRequestTechnician } from '../SERVICE_REQUESTS/service_request_technician.entity';

@Table({ tableName: 'users', timestamps: true, underscored: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: true })
  tenant_id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  email: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  password_hash: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  first_name: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  last_name: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  fcm_token: string;

  @Column({ type: DataType.STRING(500), allowNull: true })
  avatar_url: string;

  @Default('UTC')
  @Column({ type: DataType.STRING(50), allowNull: false })
  timezone: string;

  @Default('en')
  @Column({ type: DataType.STRING(10), allowNull: false })
  language: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  email_verified: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  phone_verified: boolean;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_deleted: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  last_login_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  password_changed_at: Date;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  failed_login_attempts: number;

  @Column({ type: DataType.DATE, allowNull: true })
  locked_until: Date;

  @Column({ type: DataType.STRING(255), allowNull: true })
  password_reset_token: string;

  @Column({ type: DataType.DATE, allowNull: true })
  password_reset_expires: Date;

  @Default(false)
  @Column(DataType.BOOLEAN)
  mfa_enabled: boolean;

  @Column({ type: DataType.STRING(10), allowNull: true })
  mfa_method: string;

  @Column({ type: DataType.STRING(6), allowNull: true })
  mfa_code: string;

  @Column({ type: DataType.DATE, allowNull: true })
  mfa_code_expires: Date;

  @Column({ type: DataType.STRING(255), allowNull: true })
  totp_secret: string;

  @Column({ type: DataType.JSONB, allowNull: true, defaultValue: null })
  recovery_codes: Array<{ code: string; used: boolean }> | null;

  // ── Feature 1: Onboarding ──
  @Default(false)
  @Column(DataType.BOOLEAN)
  onboarding_completed: boolean;

  // ── Feature 5: Spam Prevention ──
  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  spam_flag_count: number;

  @Default('ACTIVE')
  @Column({ type: DataType.STRING(20), allowNull: false })
  status: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  magic_link_token: string;

  @Column({ type: DataType.DATE, allowNull: true })
  magic_link_expires: Date;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  is_super_admin: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @BelongsToMany(() => Role, () => UserRole)
  roles: Role[];

  @HasMany(() => UserRole)
  userRoles: UserRole[];

  @HasMany(() => LoginSession)
  loginSessions: LoginSession[];

  @BelongsToMany(() => ServiceRequest, () => ServiceRequestTechnician)
  serviceRequests: ServiceRequest[];

  get fullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
