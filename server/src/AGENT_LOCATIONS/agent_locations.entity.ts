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
  tableName: 'agent_locations',
  timestamps: true,
  underscored: true,
})
export class AgentLocation extends Model {
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
    comment: 'FK to users',
  })
  user_id: string;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: false,
  })
  lat: number;

  @Column({
    type: DataType.DECIMAL(10, 7),
    allowNull: false,
  })
  lng: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    comment: 'GPS accuracy in meters',
  })
  accuracy: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    comment: 'Speed in km/h',
  })
  speed: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    comment: 'Compass heading in degrees',
  })
  heading: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Battery level 0-100',
  })
  battery_level: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  recorded_at: Date;

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
