import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Location } from '../LOCATIONS/locations.entity';
import { WorkingCalendar } from './working_calendars.entity';

@Table({
  tableName: 'sla_policies',
  timestamps: true,
  underscored: true,
})
export class SlaPolicy extends Model {
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
    type: DataType.STRING(200),
    allowNull: false,
  })
  name: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  category_id: string;

  @BelongsTo(() => Category)
  category: Category;

  @ForeignKey(() => SubCategory)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  sub_category_id: string;

  @BelongsTo(() => SubCategory)
  sub_category: SubCategory;

  @ForeignKey(() => Priority)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  priority_id: string;

  @BelongsTo(() => Priority)
  priority: Priority;

  @ForeignKey(() => Location)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  location_id: string;

  @BelongsTo(() => Location)
  location: Location;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  response_time_minutes: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  resolution_time_minutes: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_active: boolean;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    defaultValue: 'minutes',
  })
  time_unit: string;

  @ForeignKey(() => WorkingCalendar)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  working_calendar_id: string;

  @BelongsTo(() => WorkingCalendar)
  working_calendar: WorkingCalendar;

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
