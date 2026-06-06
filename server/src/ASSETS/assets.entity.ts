import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';

@Table({
  tableName: 'assets',
  timestamps: true,
  underscored: true,
})
export class Asset extends Model {
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
    type: DataType.STRING(200),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  model: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  serial_number: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  manufacturer: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  install_date: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  warranty_expiry: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: null,
  })
  health_score: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  category: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  custom_fields: Record<string, unknown>;

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
