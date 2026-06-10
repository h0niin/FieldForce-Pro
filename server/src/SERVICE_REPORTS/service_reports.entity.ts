import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'service_reports',
  timestamps: true,
  underscored: true,
})
export class ServiceReport extends Model {
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

  @ForeignKey(() => ServiceAppointment)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  appointment_id: string;

  @BelongsTo(() => ServiceAppointment)
  appointment: ServiceAppointment;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  technician_id: string;

  @BelongsTo(() => User)
  technician: User;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  findings: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  resolution: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  customer_signature: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  customer_name_signed: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  signed_at: Date;

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
