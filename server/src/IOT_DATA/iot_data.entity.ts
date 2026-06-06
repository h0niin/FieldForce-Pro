import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';

@Table({
  tableName: 'iot_sensor_data',
  timestamps: true,
})
export class IoTData extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @ForeignKey(() => Tenant)
  @Column(DataType.UUID)
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @AllowNull(false)
  @Column(DataType.UUID)
  asset_id: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  sensor_type: string;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 4))
  value: number;

  @Column(DataType.STRING(20))
  unit: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  recorded_at: Date;

  @Column(DataType.JSONB)
  metadata: Record<string, any>;

  @Default(false)
  @Column(DataType.BOOLEAN)
  is_deleted: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  created_at: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at: Date;
}
