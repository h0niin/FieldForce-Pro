import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { JobSheetTemplate } from '../JOB_SHEET_TEMPLATES/job_sheet_templates.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';

@Table({
  tableName: 'job_sheet_instances',
  timestamps: true,
  underscored: true,
})
export class JobSheetInstance extends Model {
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

  // FK to job_sheet_templates
  @ForeignKey(() => JobSheetTemplate)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  template_id: string;

  @BelongsTo(() => JobSheetTemplate)
  template: JobSheetTemplate;

  // FK to service_appointments
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  appointment_id: string;

  // FK to work_orders
  @ForeignKey(() => WorkOrder)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  work_order_id: string;

  @BelongsTo(() => WorkOrder)
  work_order: WorkOrder;

  @Column({
    type: DataType.ENUM('draft', 'pending', 'approved', 'in_progress', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
  })
  status: string;

  // FK to users
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  completed_by: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  completed_at: Date;

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
