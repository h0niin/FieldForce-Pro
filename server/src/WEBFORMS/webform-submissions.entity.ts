import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Webform } from './webforms.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';

@Table({
  tableName: 'webform_submissions',
  timestamps: true,
  underscored: true,
})
export class WebformSubmission extends Model {
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

  @ForeignKey(() => Webform)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  webform_id: string;

  @BelongsTo(() => Webform)
  webform: Webform;

  @ForeignKey(() => ServiceRequest)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  service_request_id: string;

  @BelongsTo(() => ServiceRequest)
  service_request: ServiceRequest;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  form_data: Record<string, unknown>;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  ip_address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  user_agent: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  referrer_url: string;

  @Column({
    type: DataType.ENUM('pending', 'processed', 'failed', 'spam'),
    defaultValue: 'pending',
  })
  status: 'pending' | 'processed' | 'failed' | 'spam';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  error_message: string;

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