import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Invoice } from '../INVOICES/invoices.entity';

@Table({
  tableName: 'payments',
  timestamps: true,
  underscored: true,
})
export class Payment extends Model {
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

  @ForeignKey(() => Invoice)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    comment: 'Reference to invoices',
  })
  invoice_id: string;

  @BelongsTo(() => Invoice)
  invoice: Invoice;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
  })
  amount: number;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'cash' })
  method: string; // cash | cheque | upi | card | bank_transfer | online | other

  @Column({ type: DataType.STRING(200), allowNull: true })
  gateway_transaction_id: string;

  @Column({ type: DataType.STRING(30), allowNull: false, defaultValue: 'confirmed' })
  status: string; // confirmed | pending_verification | rejected | pending | completed | failed | refunded

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'manual' })
  source: string; // manual | portal

  @Column({ type: DataType.STRING(200), allowNull: true })
  received_by: string; // name of dispatcher/person who recorded

  @Column({ type: DataType.TEXT, allowNull: true })
  rejection_reason: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  screenshot_url: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  paid_at: Date;

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
