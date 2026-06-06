import { Table, Column, Model, DataType, Default, IsUUID, PrimaryKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'super_admin_api_keys',
  timestamps: true,
})
export class SuperAdminApiKey extends Model<SuperAdminApiKey> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  super_admin_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  key_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  key_hash: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  is_active: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  last_used_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expires_at?: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at: Date;
}
