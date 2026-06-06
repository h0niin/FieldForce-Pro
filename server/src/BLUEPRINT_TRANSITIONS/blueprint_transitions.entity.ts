import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { BlueprintDefinition } from '../BLUEPRINT_DEFINITIONS/blueprint_definitions.entity';
import { BlueprintState } from '../BLUEPRINT_STATES/blueprint_states.entity';

@Table({
  tableName: 'blueprint_transitions',
  timestamps: true,
  underscored: true,
})
export class BlueprintTransition extends Model {
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

  @ForeignKey(() => BlueprintDefinition)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  blueprint_id: string;

  @BelongsTo(() => BlueprintDefinition)
  blueprint: BlueprintDefinition;

  @ForeignKey(() => BlueprintState)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  from_state_id: string;

  @BelongsTo(() => BlueprintState, 'from_state_id')
  from_state: BlueprintState;

  @ForeignKey(() => BlueprintState)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  to_state_id: string;

  @BelongsTo(() => BlueprintState, 'to_state_id')
  to_state: BlueprintState;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  allowed_roles: string[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  required_fields: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  webhook_url: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  guard_condition: string;

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
