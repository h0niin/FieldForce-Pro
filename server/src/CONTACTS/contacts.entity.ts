import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Company } from '../COMPANIES/companies.entity';

@Table({
  tableName: 'contacts',
  timestamps: true,
  underscored: true,
})
export class Contact extends Model {
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

  @ForeignKey(() => Company)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'Optional company association',
  })
  company_id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  first_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  last_name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    unique: false,
  })
  email: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  service_address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  billing_address: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
    defaultValue: [],
  })
  tags: string[];

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

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updated_at: Date;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @BelongsTo(() => Company)
  company: Company;
}
