import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';

@Table({ tableName: 'estimate_attachments', timestamps: false, underscored: true })
export class EstimateAttachment extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Estimate)
  @Column({ type: DataType.UUID, allowNull: false })
  estimate_id: string;

  @BelongsTo(() => Estimate)
  estimate: Estimate;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  file_name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  file_url: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  file_type: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  file_size: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  uploaded_by: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  created_at: Date;
}
