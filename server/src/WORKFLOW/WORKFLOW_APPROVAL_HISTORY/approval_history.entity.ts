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
import { DocumentApproval } from '../WORKFLOW_DOCUMENT_APPROVALS/document_approvals.entity';

@Table({
  tableName: 'workflow_approval_history',
  timestamps: false,
  underscored: true,
})
export class ApprovalHistory extends Model {
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

  @ForeignKey(() => DocumentApproval)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  approval_id: string;

  @BelongsTo(() => DocumentApproval)
  approval: DocumentApproval;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  document_id: string;

  @Column({
    type: DataType.ENUM('APPROVE', 'REJECT', 'REQUEST_CORRECTION', 'SKIP', 'DELEGATE', 'ESCALATE'),
    allowNull: false,
  })
  action: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  old_status: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  new_status: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  actor_id: string;

  @BelongsTo(() => User)
  actor: User;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comments: string;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
  })
  ip_address: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at: Date;
}
