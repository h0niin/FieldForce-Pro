import { Module } from '@nestjs/common';
import { WorkOrderNotesController } from './work_order_notes.controller';
import { WorkOrderNotesService } from './work_order_notes.service';
import { workOrderNotesProviders } from './work_order_notes.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkOrderNotesController],
  providers: [WorkOrderNotesService, ...workOrderNotesProviders],
  exports: [WorkOrderNotesService],
})
export class WorkOrderNotesModule {}
