import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../../TENANTS/tenants.entity';
import { User } from '../../USERS/users.entity';
import { WorkflowTemplate } from '../WORKFLOW_TEMPLATES/workflow_templates.entity';

@Table({
  tableName: 'workflow_approvers',
  timestamps: true,
  underscored: true,
})
export class WorkflowApprover extends Model {
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

  @ForeignKey(() => WorkflowTemplate)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  workflow_template_id: string;

  @BelongsTo(() => WorkflowTemplate)
  workflow_template: WorkflowTemplate;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  approver_id: string;

  @BelongsTo(() => User)
  approver: User;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order_no: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Approval authority level (1-10)',
  })
  approval_authority: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  amount_threshold_min: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  amount_threshold_max: number;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  budget_threshold: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_required: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

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
