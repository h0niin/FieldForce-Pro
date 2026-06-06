import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { SlaPolicy } from './sla_policies.entity';

@Table({ tableName: 'sla_pause_triggers', timestamps: true, underscored: true })
export class SlaPauseTrigger extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => SlaPolicy)
  @Column({ type: DataType.UUID, allowNull: false })
  sla_policy_id: string;

  @BelongsTo(() => SlaPolicy)
  sla_policy: SlaPolicy;

  @Column({ type: DataType.STRING(50), allowNull: false })
  status_name: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active: boolean;
}
