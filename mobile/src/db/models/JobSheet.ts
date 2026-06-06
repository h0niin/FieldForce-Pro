import { Model } from '@nozbe/watermelondb';
import { text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class JobSheet extends Model {
  static table = 'job_sheets';

  @text('server_id') serverId!: string;
  @text('work_order_id') workOrderId!: string;
  @text('appointment_id') appointmentId!: string;
  @text('technician_id') technicianId!: string;
  @text('checklist_items') checklistItems!: string;
  @text('photos') photos!: string | null;
  @text('notes') notes!: string | null;
  @text('signature_url') signatureUrl!: string | null;
  @date('completed_at') completedAt!: Date | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
