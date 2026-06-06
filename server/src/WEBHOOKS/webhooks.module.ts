import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook_delivery.service';
import { WebhookQueueService } from './webhook_queue.service';
import { webhooksProviders } from './webhooks.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookDeliveryService,
    WebhookQueueService,
    ...webhooksProviders,
  ],
  exports: [WebhooksService, WebhookDeliveryService, WebhookQueueService],
})
export class WebhooksModule {}
