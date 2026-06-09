import { Module } from '@nestjs/common';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { estimatesProviders } from './estimates.provider';
import { DatabaseModule } from '../database/database.module';
import { WorkflowModule } from '../WORKFLOW/workflow.module';
import { workflowTemplatesProviders } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.provider';
import { WorkOrdersModule } from '../WORK_ORDERS/work_orders.module';
import { WorkOrderLineItemsModule } from '../WORK_ORDER_LINE_ITEMS/work_order_line_items.module';
import { invoicesProviders } from '../INVOICES/invoices.provider';
import { invoiceLineItemsProviders } from '../INVOICE_LINE_ITEMS/invoice_line_items.provider';
import { NotificationsModule } from '../NOTIFICATIONS/notifications.module';
import { EmailService } from '../shared/services/email.service';
import { usersProviders } from '../USERS/users.provider';
import { SlaModule } from '../SLA_MODULE/sla.module';
import { WhatsAppChannelsModule } from '../WHATSAPP_CHANNELS/whatsapp_channels.module';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [DatabaseModule, WorkflowModule, WorkOrdersModule, WorkOrderLineItemsModule, NotificationsModule, SlaModule, WhatsAppChannelsModule, ActivityLogsModule],
  controllers: [EstimatesController],
  providers: [EstimatesService, EmailService, ...estimatesProviders, ...workflowTemplatesProviders, ...invoicesProviders, ...invoiceLineItemsProviders, ...usersProviders],
  exports: [EstimatesService],
})
export class EstimatesModule {}
