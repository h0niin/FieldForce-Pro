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
  tableName: 'customer_satisfaction',
  timestamps: false,
  underscored: true,
})
export class CustomerSatisfaction extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  customer_id: string;

  @BelongsTo(() => User)
  customer: User;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  rating: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comment: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  submitted_at: Date;
}
