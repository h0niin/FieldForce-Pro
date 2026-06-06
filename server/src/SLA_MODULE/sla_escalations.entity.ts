import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { SlaPolicy } from './sla_policies.entity';

@Table({ tableName: 'sla_escalations', timestamps: true, underscored: true })
export class SlaEscalation extends Model {
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

  @Column({ type: DataType.STRING(150), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  target_type: string; // 'response' or 'resolution'

  @Column({ type: DataType.INTEGER, allowNull: false })
  trigger_time_minutes: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  actions: any;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  is_active: boolean;
}
