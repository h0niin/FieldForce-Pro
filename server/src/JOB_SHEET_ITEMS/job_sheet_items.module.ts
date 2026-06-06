import { Module } from '@nestjs/common';
import { JobSheetItemsController } from './job_sheet_items.controller';
import { JobSheetItemsService } from './job_sheet_items.service';
import { jobSheetItemsProviders } from './job_sheet_items.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [JobSheetItemsController],
  providers: [JobSheetItemsService, ...jobSheetItemsProviders],
  exports: [JobSheetItemsService],
})
export class JobSheetItemsModule {}
