import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { EmailChannel } from './email_channels.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';

@Table({
  tableName: 'email_threads',
  timestamps: true,
  underscored: true,
})
export class EmailThread extends Model {
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

  @ForeignKey(() => EmailChannel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  channel_id: string;

  @BelongsTo(() => EmailChannel)
  channel: EmailChannel;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: "Customer's email address (From header)",
  })
  sender_email: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: true,
    comment: 'Parsed sender name from email header',
  })
  sender_name: string;

  @ForeignKey(() => Contact)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  contact_id: string;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => ServiceRequest)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  service_request_id: string;

  @BelongsTo(() => ServiceRequest)
  service_request: ServiceRequest;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
    comment: 'Original email subject line',
  })
  original_subject: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Email Message-ID / In-Reply-To for RFC threading',
  })
  thread_reference: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'Ticket tag embedded in subject, e.g. [Ticket #SR-xxxx]',
  })
  ticket_tag: string;

  @Column({
    type: DataType.ENUM(
      'new',
      'processing',
      'ticket_created',
      'needs_review',
      'spam',
      'ignored',
    ),
    allowNull: false,
    defaultValue: 'new',
  })
  status: string;

  // Full email messages in thread:
  // [{ direction: 'inbound'|'outbound', from, to, subject, text_body, html_body, timestamp, attachments?, message_id? }]
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  messages: Array<{
    direction: string;
    from: string;
    to: string;
    subject: string;
    text_body: string;
    html_body?: string;
    timestamp: string;
    attachments?: Array<{ filename: string; content_type: string; size?: number }>;
    message_id?: string;
  }>;

  // AI-extracted structured fields: { summary, category, sub_category, priority, location, reference_numbers, sentiment, ... }
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  extracted_data: Record<string, unknown>;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    comment: 'AI classification confidence score (0-1)',
  })
  ai_confidence: number;

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
