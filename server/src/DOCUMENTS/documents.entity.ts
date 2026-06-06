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
  tableName: 'parsed_documents',
  timestamps: true,
})
export class ParsedDocument extends Model {
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
  uploaded_by: string;

  @BelongsTo(() => User)
  uploader: User;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  file_name: string;

  @Column(DataType.STRING(50))
  file_type: string;

  @Column(DataType.INTEGER)
  file_size: number;

  @AllowNull(false)
  @Column(DataType.ENUM('invoice', 'receipt', 'contract', 'report', 'general'))
  document_type: string;

  @Column(DataType.TEXT)
  extracted_text: string;

  @Column(DataType.JSONB)
  extracted_fields: Record<string, any>;

  @Column(DataType.FLOAT)
  confidence: number;

  @Column(DataType.INTEGER)
  pages: number;

  @Default('pending')
  @Column(DataType.ENUM('pending', 'processing', 'completed', 'failed', 'reviewed'))
  status: string;

  @Column(DataType.TEXT)
  error_message: string;

  @Column(DataType.JSONB)
  corrections: Record<string, any>;

  @Column(DataType.STRING(500))
  file_url: string;

  @Column(DataType.JSONB)
  metadata: Record<string, any>;

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
