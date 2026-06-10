import { Module, forwardRef } from '@nestjs/common';
import { ServiceAppointmentsController } from './service_appointments.controller';
import { ServiceAppointmentsService } from './service_appointments.service';
import { serviceAppointmentsProviders } from './service_appointments.provider';
import { serviceAppointmentTripsProviders } from './service_appointment_trips.provider';
import { documentApprovalsProviders } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.provider';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../NOTIFICATIONS/notifications.module';
import { DocumentApprovalsModule } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.module';
import { WorkflowModule } from '../WORKFLOW/workflow.module';
import { TenantsModule } from '../TENANTS/tenants.module';
import { SubscriptionPlansModule } from '../SUBSCRIPTION_PLANS/subscription_plans.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    forwardRef(() => DocumentApprovalsModule),
    WorkflowModule,
    TenantsModule,
    SubscriptionPlansModule,
  ],
  controllers: [ServiceAppointmentsController],
  providers: [ServiceAppointmentsService, ...serviceAppointmentsProviders, ...serviceAppointmentTripsProviders, ...documentApprovalsProviders],
  exports: [ServiceAppointmentsService],
})
export class ServiceAppointmentsModule {}
