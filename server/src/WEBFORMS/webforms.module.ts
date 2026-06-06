import { Module, forwardRef } from '@nestjs/common';
import { WebformsController } from './webforms.controller';
import { WebformSubmissionsController } from './webform-submissions.controller';
import { WebformsService } from './webforms.service';
import { WebformSubmissionsService } from './webform-submissions.service';
import { webformsProviders } from './webforms.provider';
import { webformSubmissionsProvider } from './webform-submissions.provider';
import { DatabaseModule } from '../database/database.module';
import { ServiceRequestsModule } from '../SERVICE_REQUESTS/service_requests.module';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Webform } from './webforms.entity';

@Module({
  imports: [DatabaseModule, forwardRef(() => ServiceRequestsModule)],
  controllers: [WebformsController, WebformSubmissionsController],
  providers: [
    WebformsService,
    WebformSubmissionsService,
    ...webformsProviders,
    webformSubmissionsProvider,
    {
      provide: 'WebformsRepository',
      useValue: Webform,
    },
    {
      provide: 'SERVICE_REQUESTS',
      useValue: ServiceRequest,
    },
  ],
  exports: [WebformsService, WebformSubmissionsService],
})
export class WebformsModule {}
