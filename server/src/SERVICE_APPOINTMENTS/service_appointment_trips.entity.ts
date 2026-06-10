import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';
import { ServiceAppointment } from './service_appointments.entity';

/**
 * Manual trip log entered by dispatchers/admins from the web Service
 * Appointment detail page (Time & Travel tab). This is intentionally separate
 * from the GPS-based `trips` table used for live mobile tracking.
 */
@Table({
  tableName: 'service_appointment_trips',
  timestamps: true,
  underscored: true,
})
export class ServiceAppointmentTrip extends Model {
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
    comment: 'FK to service_appointments',
  })
  appointment_id: string;

  @BelongsTo(() => ServiceAppointment)
  appointment: ServiceAppointment;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  trip_date: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: false,
  })
  start_location: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: false,
  })
  end_location: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  departure_time: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  arrival_time: Date;

  @Column({
    type: DataType.DECIMAL(8, 2),
    allowNull: true,
  })
  distance_km: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to users - who logged the trip',
  })
  created_by: string;

  @BelongsTo(() => User, 'created_by')
  creator: User;

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
