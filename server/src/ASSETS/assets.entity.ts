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
import { Company } from '../COMPANIES/companies.entity';

export enum AssetStatus {
  OPERATIONAL = 'OPERATIONAL',
  NEEDS_REPAIR = 'NEEDS_REPAIR',
  IN_REPAIR = 'IN_REPAIR',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

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

  @BelongsTo(() => Tenant, { as: 'tenant' })
  tenant: Tenant;

  @ForeignKey(() => Contact)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  contact_id: string;

  @BelongsTo(() => Contact, { as: 'contact' })
  contact: Contact;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  company_id: string;

  @BelongsTo(() => Company, { as: 'company' })
  company: Company;

  @ForeignKey(() => Asset)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  parent_asset_id: string;

  @BelongsTo(() => Asset, { foreignKey: 'parent_asset_id', as: 'parent_asset' })
  parent_asset: Asset;

  @ForeignKey(() => ServiceLocation)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  service_location_id: string;

  @BelongsTo(() => ServiceLocation, { foreignKey: 'service_location_id', as: 'location' })
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
    unique: true,
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
  installation_date: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_service_date: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  warranty_expiry: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  product_category: string;

  @Column({
    type: DataType.ENUM(...Object.values(AssetStatus)),
    allowNull: false,
    defaultValue: AssetStatus.OPERATIONAL,
  })
  status: AssetStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  giai: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  ordered_date: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  purchased_date: string;

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
