import {
  Column,
  Model,
  Table,
  DataType,
  IsUUID,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'activity_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ActivityLog extends Model {
  @IsUUID(4)
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @IsUUID(4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenant_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  entity_type: string;

  @IsUUID(4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  entity_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  action: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column(DataType.DATE)
  created_at: Date;

  @Column(DataType.DATE)
  updated_at: Date;
}
