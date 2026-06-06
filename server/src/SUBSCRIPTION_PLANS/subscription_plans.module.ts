import { Module } from '@nestjs/common';
import { subscriptionPlansProviders } from './subscription_plans.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [...subscriptionPlansProviders],
  exports: [...subscriptionPlansProviders],
})
export class SubscriptionPlansModule {}
