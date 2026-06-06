import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'request_attachments',
  timestamps: false,
  underscored: true,
})
export class RequestAttachment extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => ServiceRequest)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  request_id: string;

  @BelongsTo(() => ServiceRequest)
  serviceRequest: ServiceRequest;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  file_name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  file_url: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  file_type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  file_size: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  uploaded_by: string;

  @BelongsTo(() => User)
  uploadedByUser: User;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
}
