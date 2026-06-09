import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service_requests.controller';
import { QueueController } from './queue.controller';
import { ServiceRequestsService } from './service_requests.service';
import { serviceRequestsProviders } from './service_requests.provider';
import { workflowTemplatesProviders } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.provider';
import { serviceLocationsProviders } from '../SERVICE_LOCATIONS/service_locations.provider';
import { DatabaseModule } from '../database/database.module';
import { WorkflowModule } from '../WORKFLOW/workflow.module';
import { ApiKeysModule } from '../API_KEYS/api_keys.module';
import { ApiKeyGuard } from '../shared/guards/api-key.guard';
import { NotificationsModule } from '../NOTIFICATIONS/notifications.module';
import { workOrdersProviders } from '../WORK_ORDERS/work_orders.provider';
import { SlaModule } from '../SLA_MODULE/sla.module';
import { UsersModule } from '../USERS/users.module';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [DatabaseModule, WorkflowModule, ApiKeysModule, NotificationsModule, SlaModule, UsersModule, ActivityLogsModule],
  controllers: [ServiceRequestsController, QueueController],
  providers: [
    ServiceRequestsService,
    ApiKeyGuard,
    ...serviceRequestsProviders,
    ...workflowTemplatesProviders,
    ...workOrdersProviders,
    ...serviceLocationsProviders,
  ],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
