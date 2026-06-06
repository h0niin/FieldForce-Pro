import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Timesheet extends Model {
  static table = 'timesheets';

  @text('server_id') serverId!: string;
  @text('user_id') userId!: string;
  @text('tenant_id') tenantId!: string;
  @date('clock_in') clockIn!: Date;
  @date('clock_out') clockOut!: Date | null;
  @text('status') status!: string;
  @field('total_hours') totalHours!: number | null;
  @text('notes') notes!: string | null;
  @field('latitude_in') latitudeIn!: number | null;
  @field('longitude_in') longitudeIn!: number | null;
  @field('latitude_out') latitudeOut!: number | null;
  @field('longitude_out') longitudeOut!: number | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
