import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { WhatsAppChannel } from './whatsapp_channels.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';

@Table({
  tableName: 'whatsapp_conversations',
  timestamps: true,
  underscored: true,
})
export class WhatsAppConversation extends Model {
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

  @ForeignKey(() => WhatsAppChannel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  channel_id: string;

  @BelongsTo(() => WhatsAppChannel)
  channel: WhatsAppChannel;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  customer_phone: string;

  @ForeignKey(() => Contact)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  contact_id: string;

  @BelongsTo(() => Contact)
  contact: Contact;

  @Column({
    type: DataType.ENUM('active', 'draft', 'completed', 'handed_off', 'abandoned'),
    allowNull: false,
    defaultValue: 'active',
  })
  status: string;

  // Full message history: [{ role: 'customer'|'ai'|'staff', content, timestamp, media_url? }]
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    media_url?: string;
  }>;

  // Structured data collected so far: { customer_name, issue_description, category, location, priority, ... }
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  collected_data: Record<string, unknown>;

  @ForeignKey(() => ServiceRequest)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  service_request_id: string;

  @BelongsTo(() => ServiceRequest)
  service_request: ServiceRequest;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_customer_message_at: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  reminder_sent: boolean;

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
