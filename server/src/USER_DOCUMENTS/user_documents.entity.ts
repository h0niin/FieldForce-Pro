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
import { User } from '../USERS/users.entity';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({ tableName: 'user_documents', timestamps: true, underscored: true })
export class UserDocument extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  user_id: string;

  @Column({
    type: DataType.ENUM(
      'certification',
      'license',
      'id_proof',
      'insurance',
      'contract',
      'other',
    ),
    allowNull: false,
  })
  document_type:
    | 'certification'
    | 'license'
    | 'id_proof'
    | 'insurance'
    | 'contract'
    | 'other';

  @Column({ type: DataType.STRING(200), allowNull: false })
  document_name: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  file_url: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  file_type: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  file_size: number;

  @Column({ type: DataType.DATE, allowNull: true })
  issue_date: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  expiry_date: Date;

  @Column({ type: DataType.STRING(100), allowNull: true })
  issuing_authority: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  document_number: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_verified: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  verified_at: Date;

  @Column({ type: DataType.UUID, allowNull: true })
  verified_by: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_deleted: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Tenant)
  tenant: Tenant;
}
