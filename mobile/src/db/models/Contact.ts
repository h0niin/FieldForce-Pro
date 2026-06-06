import { Model } from '@nozbe/watermelondb';
import { text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Contact extends Model {
  static table = 'contacts';

  @text('server_id') serverId!: string;
  @text('tenant_id') tenantId!: string;
  @text('name') name!: string;
  @text('first_name') firstName!: string | null;
  @text('last_name') lastName!: string | null;
  @text('email') email!: string | null;
  @text('phone') phone!: string | null;
  @text('company') company!: string | null;
  @text('company_id') companyId!: string | null;
  @text('address') address!: string | null;
  @text('notes') notes!: string | null;
  @text('tags') tags!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
