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
  tableName: 'email_channels',
  timestamps: true,
  underscored: true,
})
export class EmailChannel extends Model {
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
    unique: true,
  })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({
    type: DataType.ENUM('forwarding', 'platform_provided'),
    allowNull: false,
    defaultValue: 'forwarding',
  })
  connection_method: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'The support email address customers email (e.g. support@fieldforce.com)',
  })
  support_email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Platform-issued address for forwarding (e.g. fieldforce@tickets.yourfsm.com)',
  })
  platform_email: string;

  @Column({
    type: DataType.ENUM('not_receiving', 'receiving', 'error'),
    allowNull: false,
    defaultValue: 'not_receiving',
  })
  status: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    defaultValue: 'Support Team',
    comment: 'The sender name customers see on AI replies',
  })
  reply_from_name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Reply-from email address',
  })
  reply_from_email: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue:
      "Thanks for contacting us. We've logged your request as {ticket_number}.\n\n• Issue: {summary}\n• Category: {category}\n\nWe'll be in touch shortly. Just reply to this email if you have more details.",
  })
  acknowledgement_template: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue:
      "Thanks for reaching out. So we can help quickly, could you tell us more about what exactly isn't working and where?\n\nWe've logged this as {ticket_number} in the meantime.",
  })
  clarification_template: string;

  // Categories the AI may assign (from the company's existing settings)
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: ['General', 'Electrical', 'Plumbing', 'HVAC', 'IT', 'Cleaning', 'Other'],
  })
  category_mapping: string[];

  // Priority rules: keyword → priority mappings
  // e.g. { "keywords": { "urgent": "HIGH", "down": "HIGH", "asap": "HIGH", "emergency": "CRITICAL" }, "domains": {} }
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {
      keywords: {
        urgent: 'HIGH',
        emergency: 'CRITICAL',
        asap: 'HIGH',
        down: 'HIGH',
        'not working': 'HIGH',
        critical: 'CRITICAL',
      },
      domains: {},
    },
  })
  priority_rules: Record<string, unknown>;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: 'General',
  })
  default_category: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: 'MEDIUM',
  })
  default_priority: string;

  // Optional domain/email allowlist — e.g. ["@acme.com", "@bigcorp.com"]
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  allowed_senders: string[];

  // Block patterns — e.g. ["no-reply@*", "noreply@*", "mailer-daemon@*"]
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: ['no-reply@', 'noreply@', 'mailer-daemon@'],
  })
  blocked_senders: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Filter out-of-office replies, bounce messages, and marketing',
  })
  spam_filter_enabled: boolean;

  // Keywords that trigger human review instead of auto-processing
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: ['lawyer', 'legal', 'refund', 'sue', 'complaint', 'attorney'],
  })
  human_handoff_keywords: string[];

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    comment: 'Team/queue for sensitive emails requiring human review',
  })
  handoff_team: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_active: boolean;

  // SMTP config for sending outbound replies (if different from global mail config)
  // { host, port, user, password, tls }
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  smtp_config: Record<string, unknown>;

  // Secret for validating inbound webhook payloads
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  webhook_secret: string;

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
