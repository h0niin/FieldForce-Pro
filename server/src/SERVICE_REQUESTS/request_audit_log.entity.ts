import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { ServiceRequest } from './service_requests.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'request_audit_log',
  timestamps: false, // only has changed_at
  underscored: true,
})
export class RequestAuditLog extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  changed_by: string;

  @BelongsTo(() => User)
  changedByUser: User;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  field_changed: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  old_value: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  new_value: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  changed_at: Date;
}
