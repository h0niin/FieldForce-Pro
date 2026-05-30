import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';

@Table({
  tableName: 'work_orders',
  timestamps: true,
  underscored: true,
})
export class WorkOrder extends Model {
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

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to service_requests',
  })
  request_id: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to estimates',
  })
  estimate_id: string;

  @ForeignKey(() => Contact)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  contact_id: string;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => ServiceLocation)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  location_id: string;

  @BelongsTo(() => ServiceLocation)
  location: ServiceLocation;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'FK to assets',
  })
  asset_id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'Auto-generated work order number',
  })
  wo_number: string;

  @Column({
    type: DataType.ENUM('new', 'estimated', 'approved', 'scheduled', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled'),
    allowNull: false,
    defaultValue: 'new',
  })
  status: string;

  @Column({
    type: DataType.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  })
  priority: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  category: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: false,
  })
  summary: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  scheduled_start: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  scheduled_end: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  actual_start: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  actual_end: Date;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'Assigned technician/user UUID',
  })
  assigned_to: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  tags: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_recurring: boolean;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: 'iCalendar RRULE format',
  })
  recurrence_rule: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  custom_fields: Record<string, unknown>;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 24,
  })
  slaHours: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  slaBreachAt: Date;

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
