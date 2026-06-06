import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({ tableName: 'working_calendars', timestamps: true, underscored: true })
export class WorkingCalendar extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  timezone: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  business_hours: any;

  @Column({ type: DataType.JSONB, allowNull: true })
  holidays: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  is_default: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active: boolean;
}
