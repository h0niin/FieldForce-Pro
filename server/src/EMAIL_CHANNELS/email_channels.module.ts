import { Module } from '@nestjs/common';
import { EmailChannelsController } from './email_channels.controller';
import { EmailChannelsService } from './email_channels.service';
import { EmailProcessingService } from './email_processing.service';
import { EmailAiService } from './email_ai.service';
import { emailChannelsProviders } from './email_channels.provider';
import { DatabaseModule } from '../database/database.module';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { KEYNAMES } from '../shared/constants/keynames';

@Module({
  imports: [DatabaseModule],
  controllers: [EmailChannelsController],
  providers: [
    EmailChannelsService,
    EmailProcessingService,
    EmailAiService,
    ...emailChannelsProviders,
    // Inject existing repositories needed by the processing service
    {
      provide: KEYNAMES.SERVICE_REQUESTS,
      useValue: ServiceRequest,
    },
    {
      provide: KEYNAMES.CONTACTS,
      useValue: Contact,
    },
  ],
  exports: [EmailChannelsService, EmailProcessingService],
})
export class EmailChannelsModule {}
