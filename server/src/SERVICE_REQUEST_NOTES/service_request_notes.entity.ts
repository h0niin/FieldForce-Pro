import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';

@Table({ tableName: 'service_request_notes', timestamps: true, underscored: true })
export class ServiceRequestNote extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @ForeignKey(() => ServiceRequest)
  @Column({ type: DataType.UUID, allowNull: false })
  service_request_id: string;

  @Column({ type: DataType.UUID, allowNull: true })
  user_id: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  author_name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  content: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_deleted: boolean;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @BelongsTo(() => ServiceRequest)
  service_request: ServiceRequest;
}
