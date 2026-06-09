import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Tenant } from '../TENANTS/tenants.entity';
import { User } from '../USERS/users.entity';

@Table({
  tableName: 'dispatch_console_layouts',
  timestamps: true,
  underscored: true,
})
export class DispatchConsoleLayout extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => Tenant)
  @Column({ type: DataType.UUID, allowNull: false })
  tenant_id: string;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({ type: DataType.STRING(50), allowNull: false })
  view_type: string; // 'gantt' | 'grid' | 'calendar'

  @Default('classic')
  @Column({ type: DataType.STRING(50), allowNull: false })
  layout_mode: string; // 'classic' | 'compact' | 'comfortable'

  @Default([])
  @Column(DataType.JSONB)
  visible_fields: string[]; // Ordered list of field names that are visible

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  last_modified_by: string;

  @BelongsTo(() => User, 'last_modified_by')
  modifier: User;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;
}
