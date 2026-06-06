import { Module } from '@nestjs/common';
import { DocumentApprovalsController } from './document_approvals.controller';
import { DocumentApprovalsService } from './document_approvals.service';
import { documentApprovalsProviders } from './document_approvals.provider';
import { workflowTemplatesProviders } from '../WORKFLOW_TEMPLATES/workflow_templates.provider';
import { workflowApproversProviders } from '../WORKFLOW_APPROVERS/workflow_approvers.provider';
import { approvalHistoryProviders } from '../WORKFLOW_APPROVAL_HISTORY/approval_history.provider';
import { serviceRequestsProviders } from '../../SERVICE_REQUESTS/service_requests.provider';
import { estimatesProviders } from '../../ESTIMATES/estimates.provider';
import { workOrdersProviders } from '../../WORK_ORDERS/work_orders.provider';
import { serviceAppointmentsProviders } from '../../SERVICE_APPOINTMENTS/service_appointments.provider';
import { jobSheetInstancesProviders } from '../../JOB_SHEET_INSTANCES/job_sheet_instances.provider';
import { jobSheetTemplatesProviders } from '../../JOB_SHEET_TEMPLATES/job_sheet_templates.provider';
import { invoicesProviders } from '../../INVOICES/invoices.provider';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../../NOTIFICATIONS/notifications.module';
import { UsersModule } from '../../USERS/users.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, UsersModule],
  controllers: [DocumentApprovalsController],
  providers: [
    DocumentApprovalsService,
    ...documentApprovalsProviders,
    ...workflowTemplatesProviders,
    ...workflowApproversProviders,
    ...approvalHistoryProviders,
    ...serviceRequestsProviders,
    ...estimatesProviders,
    ...workOrdersProviders,
    ...serviceAppointmentsProviders,
    ...jobSheetInstancesProviders,
    ...jobSheetTemplatesProviders,
    ...invoicesProviders,
  ],
  exports: [DocumentApprovalsService],
})
export class DocumentApprovalsModule {}
