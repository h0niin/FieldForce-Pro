import { Module } from '@nestjs/common';
import { WorkOrderLineItemsController } from './work_order_line_items.controller';
import { WorkOrderLineItemsService } from './work_order_line_items.service';
import { workOrderLineItemsProviders } from './work_order_line_items.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkOrderLineItemsController],
  providers: [WorkOrderLineItemsService, ...workOrderLineItemsProviders],
  exports: [WorkOrderLineItemsService],
})
export class WorkOrderLineItemsModule {}
