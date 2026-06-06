import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Trip extends Model {
  static table = 'trips';

  @text('server_id') serverId!: string;
  @text('appointment_id') appointmentId!: string;
  @text('technician_id') technicianId!: string;
  @text('status') status!: string;
  @field('start_latitude') startLatitude!: number | null;
  @field('start_longitude') startLongitude!: number | null;
  @field('end_latitude') endLatitude!: number | null;
  @field('end_longitude') endLongitude!: number | null;
  @field('distance_km') distanceKm!: number | null;
  @field('duration_minutes') durationMinutes!: number | null;
  @date('started_at') startedAt!: Date | null;
  @date('completed_at') completedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
