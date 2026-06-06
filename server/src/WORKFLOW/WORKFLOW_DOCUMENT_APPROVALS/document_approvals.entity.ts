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
  tableName: 'workflow_document_approvals',
  timestamps: true,
  underscored: true,
})
export class DocumentApproval extends Model {
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
    type: DataType.UUID,
    allowNull: false,
    comment: 'ID of the document being approved',
  })
  document_id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  document_type: string;

  @ForeignKey(() => WorkflowTemplate)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  workflow_id: string;

  @BelongsTo(() => WorkflowTemplate)
  workflow_template: WorkflowTemplate;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  workflow_version: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  approver_id: string;

  @BelongsTo(() => User, 'approver_id')
  approver: User;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    comment: 'Original approver if this was delegated',
  })
  delegated_from_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order_no: number;

  @Column({
    type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'CORRECTION_REQUIRED'),
    allowNull: false,
    defaultValue: 'PENDING',
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comments: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  action_date: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  escalated_at: Date;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  escalated_to_id: string;

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
