import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'global_attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class GlobalAttachment extends Model<GlobalAttachment> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'e.g., Contact, Company, Asset',
  })
  entity_type: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  entity_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  tenant_id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  uploaded_by: string;

  @BelongsTo(() => User, 'uploaded_by')
  uploader: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_url: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  file_type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  file_size: number;
}
