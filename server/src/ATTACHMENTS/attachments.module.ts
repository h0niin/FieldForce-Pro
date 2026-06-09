import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { RequestAttachment } from './request_attachments.entity';
import { EstimateAttachment } from './estimate_attachments.entity';
import { GlobalAttachment } from './global_attachments.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { REPOSITORY } from '../shared/constants/keynames';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    {
      provide: REPOSITORY.REQUEST_ATTACHMENTS,
      useValue: RequestAttachment,
    },
    {
      provide: REPOSITORY.ESTIMATE_ATTACHMENTS,
      useValue: EstimateAttachment,
    },
    {
      provide: REPOSITORY.GLOBAL_ATTACHMENTS,
      useValue: GlobalAttachment,
    },
    {
      provide: REPOSITORY.SERVICE_REQUESTS,
      useValue: ServiceRequest,
    },
    {
      provide: REPOSITORY.ESTIMATES,
      useValue: Estimate,
    },
  ],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
