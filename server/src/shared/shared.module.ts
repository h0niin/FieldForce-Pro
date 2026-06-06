import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigService } from './config/config.service';
import { PdfService } from './services/pdf.service';
import { SchedulerService } from './services/scheduler.service';
import { DatabaseModule } from '../database/database.module';
import { estimatesProviders } from '../ESTIMATES/estimates.provider';
import { invoicesProviders } from '../INVOICES/invoices.provider';
import { workOrdersProviders } from '../WORK_ORDERS/work_orders.provider';

import { StripeService } from './services/stripe.service';
import { RazorpayService } from './services/razorpay.service';
import { PushNotificationService } from './services/push-notification.service';
import { SlaTimersModule } from '../SLA_TIMERS/sla_timers.module';
import { NotificationsModule } from '../NOTIFICATIONS/notifications.module';
import { RedisCacheService } from './services/redis-cache.service';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, ScheduleModule.forRoot(), SlaTimersModule, NotificationsModule],
  providers: [
    AppConfigService,
    PdfService,
    SchedulerService,
    StripeService,
    RazorpayService,
    PushNotificationService,
    RedisCacheService,
    ...estimatesProviders,
    ...invoicesProviders,
    ...workOrdersProviders,
  ],
  exports: [AppConfigService, PdfService, SchedulerService, StripeService, RazorpayService, PushNotificationService, RedisCacheService],
})
export class SharedModule { }
