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
import { Company } from '../COMPANIES/companies.entity';
import { Territory } from '../TERRITORIES/territories.entity';

@Table({
  tableName: 'service_locations',
  timestamps: true,
  underscored: true,
})
export class ServiceLocation extends Model {
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

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  company_id: string;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => Territory)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  territory_id: string;

  @BelongsTo(() => Territory)
  territory: Territory;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  address: string;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: true,
  })
  lat: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: true,
  })
  lng: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  access_notes: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  gate_code: string;

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
