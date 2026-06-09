import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { User } from '../USERS/users.entity';
import { Asset } from '../ASSETS/assets.entity';
import { ServiceRequestTechnician } from './service_request_technician.entity';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { ServiceRequestSla } from '../SLA_MODULE/service_request_slas.entity';
import { HasOne } from 'sequelize-typescript';

@Table({
  tableName: 'service_requests',
  timestamps: true,
  underscored: true,
})
export class ServiceRequest extends Model {
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

  @ForeignKey(() => Asset)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  asset_id: string;

  @BelongsTo(() => Asset)
  asset: Asset;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    unique: true,
  })
  request_number: string;

  @Column({
    type: DataType.STRING(300),
    allowNull: false,
  })
  subject: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  // ── Feature 4: Priority-Based Queue ──
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    defaultValue: 'MEDIUM',
    get() {
      const val = this.getDataValue('priority');
      if (!val) return val;
      if (val === 'CRITICAL') return 'urgent';
      return val.toLowerCase();
    },
    set(val: string) {
      if (!val) return;
      if (val.toLowerCase() === 'urgent') {
        this.setDataValue('priority', 'CRITICAL');
      } else {
        this.setDataValue('priority', val.toUpperCase());
      }
    }
  })
  priority: string;

  @ForeignKey(() => Priority)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  priority_id: string;

  @BelongsTo(() => Priority)
  priority_lookup: Priority;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  category: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  category_id: string;

  @BelongsTo(() => Category)
  category_lookup: Category;

  @ForeignKey(() => SubCategory)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  sub_category_id: string;

  @BelongsTo(() => SubCategory)
  sub_category: SubCategory;

  @Column({
    type: DataType.ENUM(
      'new',
      'triaged',
      'estimated',
      'approved',
      'rejected',
      'converted_to_wo',
      'closed',
      'spam',
    ),
    allowNull: false,
    defaultValue: 'new',
  })
  status: string;

  @Column({
    type: DataType.ENUM(
      'phone',
      'email',
      'portal',
      'webform',
      'api',
      'whatsapp',
      'sms',
    ),
    allowNull: false,
    defaultValue: 'phone',
  })
  channel: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  assigned_to: string;

  @BelongsTo(() => User)
  assignee: User;

  @BelongsToMany(() => User, () => ServiceRequestTechnician)
  technicians: User[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
    defaultValue: {},
  })
  custom_fields: Record<string, unknown>;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: true,
  })
  lat: number;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: true,
  })
  lng: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  scheduled_start: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  scheduled_end: Date;

  @HasOne(() => ServiceRequestSla)
  sla: ServiceRequestSla;

  // ── Feature 5: Spam Prevention ──
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_spam_flagged: boolean;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  spam_reason: string;

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
