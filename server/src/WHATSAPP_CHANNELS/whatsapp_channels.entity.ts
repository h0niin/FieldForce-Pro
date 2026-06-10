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
  tableName: 'whatsapp_channels',
  timestamps: true,
  underscored: true,
})
export class WhatsAppChannel extends Model {
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
    type: DataType.ENUM('web_js', 'business_api'),
    allowNull: false,
    defaultValue: 'web_js',
  })
  connection_method: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone_number: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  display_name: string;

  @Column({
    type: DataType.ENUM('disconnected', 'pending', 'connected'),
    allowNull: false,
    defaultValue: 'disconnected',
  })
  status: string;


  // Meta Cloud API credentials: { app_id, app_secret, phone_number_id, access_token, waba_id, verify_token }
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  meta_config: Record<string, unknown>;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: "Hi 👋 I'm your support assistant. Tell me what you need help with.",
  })
  greeting_message: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: '✅ Your service request has been created. Our team will contact you shortly.',
  })
  confirmation_message: string;

  @Column({
    type: DataType.ENUM('24_7', 'office_hours'),
    allowNull: false,
    defaultValue: '24_7',
  })
  working_hours_mode: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: { start: '09:00', end: '18:00', timezone: 'Asia/Dubai' },
  })
  office_hours: Record<string, unknown>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: ['en'],
  })
  languages: string[];

  // Which fields the AI must collect: { name: true, location: true, category: true, photos: false, ... }
  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: { name: true, location: true, category: true, photos: false, preferred_time: false },
  })
  required_fields: Record<string, boolean>;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: 'MEDIUM',
  })
  default_priority: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  handoff_team: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: [],
  })
  blocked_numbers: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_active: boolean;

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
