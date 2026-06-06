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
  tableName: 'service_request_technicians',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['service_request_id', 'technician_id'],
      name: 'uq_sr_technician',
    },
  ],
})
export class ServiceRequestTechnician extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ServiceRequest)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  service_request_id: string;

  @BelongsTo(() => ServiceRequest)
  serviceRequest: ServiceRequest;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  technician_id: string;

  @BelongsTo(() => User)
  technician: User;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;
}
