import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Appointment extends Model {
  static table = 'appointments';

  @text('server_id') serverId!: string;
  @text('work_order_id') workOrderId!: string;
  @text('tenant_id') tenantId!: string;
  @text('status') status!: string;
  @date('scheduled_start') scheduledStart!: Date;
  @date('scheduled_end') scheduledEnd!: Date;
  @date('actual_start') actualStart!: Date | null;
  @date('actual_end') actualEnd!: Date | null;
  @text('technician_id') technicianId!: string;
  @text('customer_name') customerName!: string;
  @text('customer_phone') customerPhone!: string | null;
  @text('address') address!: string;
  @field('latitude') latitude!: number | null;
  @field('longitude') longitude!: number | null;
  @text('notes') notes!: string | null;
  @text('signature_url') signatureUrl!: string | null;
  @text('photos') photos!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
