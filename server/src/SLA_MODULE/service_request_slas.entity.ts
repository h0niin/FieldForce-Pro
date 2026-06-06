import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { SlaPolicy } from './sla_policies.entity';

@Table({
  tableName: 'service_request_slas',
  timestamps: true,
  underscored: true,
})
export class ServiceRequestSla extends Model {
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
  service_request: ServiceRequest;

  @ForeignKey(() => SlaPolicy)
  @Column({
    type: DataType.UUID,
    allowNull: true, // Allow null if no policy matched
  })
  policy_id: string;

  @BelongsTo(() => SlaPolicy)
  policy: SlaPolicy;

  // RESPONSE SLA
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  response_deadline: Date;

  @Column({
    type: DataType.ENUM('PENDING', 'PAUSED', 'MET', 'BREACHED'),
    allowNull: false,
    defaultValue: 'PENDING',
  })
  response_status: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  response_time_ms: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  response_completed_at: Date;

  // RESOLUTION SLA
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resolution_deadline: Date;

  @Column({
    type: DataType.ENUM('PENDING', 'PAUSED', 'MET', 'BREACHED'),
    allowNull: false,
    defaultValue: 'PENDING',
  })
  resolution_status: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  resolution_time_ms: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  resolution_completed_at: Date;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
  })
  total_paused_ms: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_paused_at: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updated_at: Date;
}
