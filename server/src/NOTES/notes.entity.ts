import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'notes',
  timestamps: true,
  paranoid: true, // Use soft deletes
  deletedAt: 'deleted_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Note extends Model<Note> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  tenant_id: string;

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
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  created_by: string;

  @BelongsTo(() => User, 'created_by')
  author: User;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_deleted: boolean;
}
