import { Module, forwardRef } from '@nestjs/common';
import { WorkOrdersController } from './work_orders.controller';
import { WorkOrdersService } from './work_orders.service';
import { workOrdersProviders } from './work_orders.provider';
import { workflowTemplatesProviders } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.provider';
import { DatabaseModule } from '../database/database.module';
import { InvoicesModule } from '../INVOICES/invoices.module';
import { WorkflowModule } from '../WORKFLOW/workflow.module';
import { WorkOrderTechnicianSessionsModule } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.module';

@Module({
  imports: [DatabaseModule, InvoicesModule, WorkflowModule, forwardRef(() => WorkOrderTechnicianSessionsModule)],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, ...workOrdersProviders, ...workflowTemplatesProviders],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
