import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({
  tableName: 'communications',
  timestamps: true,
  underscored: true,
})
export class Communication extends Model {
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
    allowNull: false,
    comment: 'Reference to contacts',
  })
  contact_id: string;

  @Column({
    type: DataType.ENUM('email', 'sms', 'whatsapp', 'in_app'),
    allowNull: false,
    defaultValue: 'email',
  })
  channel: string;

  @Column({
    type: DataType.ENUM('inbound', 'outbound'),
    allowNull: false,
    defaultValue: 'outbound',
  })
  direction: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
  })
  subject: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  body: string;

  @Column({
    type: DataType.ENUM('draft', 'sent', 'delivered', 'failed'),
    allowNull: false,
    defaultValue: 'draft',
  })
  status: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  sent_at: Date;

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
