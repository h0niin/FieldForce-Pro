import { Module } from '@nestjs/common';
import { JobSheetTemplatesController } from './job_sheet_templates.controller';
import { JobSheetTemplatesService } from './job_sheet_templates.service';
import { jobSheetTemplatesProviders } from './job_sheet_templates.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [JobSheetTemplatesController],
  providers: [JobSheetTemplatesService, ...jobSheetTemplatesProviders],
  exports: [JobSheetTemplatesService],
})
export class JobSheetTemplatesModule {}
