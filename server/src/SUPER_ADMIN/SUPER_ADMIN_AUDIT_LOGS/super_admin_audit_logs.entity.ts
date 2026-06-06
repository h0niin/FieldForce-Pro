import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'super_admin_audit_logs',
  timestamps: true,
  updatedAt: false, // Audit logs don't need update timestamps
})
export class SuperAdminAuditLog extends Model<SuperAdminAuditLog> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  super_admin_id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  action: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  resource?: string; // e.g. 'Tenant', 'API Key'

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  target_id?: string; // ID of the resource affected, e.g. tenant id

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  details?: Record<string, unknown>;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  ip_address?: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
}
