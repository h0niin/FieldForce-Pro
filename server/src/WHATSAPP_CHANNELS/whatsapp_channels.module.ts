import { Module } from '@nestjs/common';
import { WhatsAppChannelsController } from './whatsapp_channels.controller';
import { WhatsAppChannelsService } from './whatsapp_channels.service';
import { WhatsAppWebhookService } from './whatsapp_webhook.service';
import { WhatsAppAiService } from './whatsapp_ai.service';
import { WhatsAppWebJsService } from './whatsapp_webjs.service';
import { whatsappChannelsProviders } from './whatsapp_channels.provider';
import { DatabaseModule } from '../database/database.module';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { KEYNAMES } from '../shared/constants/keynames';

@Module({
  imports: [DatabaseModule],
  controllers: [WhatsAppChannelsController],
  providers: [
    WhatsAppChannelsService,
    WhatsAppWebhookService,
    WhatsAppAiService,
    WhatsAppWebJsService,
    ...whatsappChannelsProviders,
    // Inject existing repositories needed by the webhook service
    {
      provide: KEYNAMES.SERVICE_REQUESTS,
      useValue: ServiceRequest,
    },
    {
      provide: KEYNAMES.CONTACTS,
      useValue: Contact,
    },
  ],
  exports: [WhatsAppChannelsService, WhatsAppWebhookService, WhatsAppWebJsService],
})
export class WhatsAppChannelsModule {}
