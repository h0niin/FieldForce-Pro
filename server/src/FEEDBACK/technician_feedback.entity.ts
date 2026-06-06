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
  tableName: 'technician_feedback',
  timestamps: false,
  underscored: true,
})
export class TechnicianFeedback extends Model {
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
  technician_id: string;

  @BelongsTo(() => User)
  technician: User;

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
  difficulty_rating: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  time_taken_minutes: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  work_summary: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  flags: string[];

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
}
