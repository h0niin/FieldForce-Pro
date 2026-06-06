import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class Pricebook extends Model {
    static table = 'pricebooks';

    @field('server_id') server_id!: string;
    @field('tenant_id') tenant_id!: string;
    @field('service_id') service_id!: string | null;
    @field('name') name!: string;
    @field('tier') tier!: 'good' | 'better' | 'best';
    @field('price') price!: number;
    @field('description') description!: string | null;
    @field('is_active') is_active!: boolean;

    @readonly @date('created_at') created_at!: Date;
    @readonly @date('updated_at') updated_at!: Date;
}
