import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class WorkOrder extends Model {
  static table = 'work_orders';

  @text('server_id') serverId!: string;
  @text('tenant_id') tenantId!: string;
  @text('work_order_number') workOrderNumber!: string;
  @text('title') title!: string;
  @text('description') description!: string | null;
  @text('status') status!: string;
  @text('priority') priority!: string;
  @text('customer_name') customerName!: string;
  @text('customer_phone') customerPhone!: string | null;
  @text('customer_email') customerEmail!: string | null;
  @text('address') address!: string;
  @field('latitude') latitude!: number | null;
  @field('longitude') longitude!: number | null;
  @date('scheduled_start') scheduledStart!: Date | null;
  @date('scheduled_end') scheduledEnd!: Date | null;
  @date('actual_start') actualStart!: Date | null;
  @date('actual_end') actualEnd!: Date | null;
  @text('assigned_to') assignedTo!: string | null;
  @text('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
