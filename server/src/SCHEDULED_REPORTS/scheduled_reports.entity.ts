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
  tableName: 'scheduled_reports',
  timestamps: true,
  underscored: true,
})
export class ScheduledReport extends Model {
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
  report_name: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  recipients: string[];

  @Column({
    type: DataType.ENUM('daily', 'weekly', 'monthly', 'quarterly'),
    allowNull: false,
  })
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  day_of_week: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  day_of_month: number | null;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  send_time: string;

  @Column({
    type: DataType.ENUM('pdf', 'xlsx', 'csv'),
    allowNull: false,
    defaultValue: 'pdf',
  })
  format: 'pdf' | 'xlsx' | 'csv';

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  is_active: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  next_run: Date | null;

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
