import { Module } from '@nestjs/common';
import { WorkOrderAttachmentsController } from './work_order_attachments.controller';
import { WorkOrderAttachmentsService } from './work_order_attachments.service';
import { workOrderAttachmentsProviders } from './work_order_attachments.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkOrderAttachmentsController],
  providers: [WorkOrderAttachmentsService, ...workOrderAttachmentsProviders],
  exports: [WorkOrderAttachmentsService],
})
export class WorkOrderAttachmentsModule {}
