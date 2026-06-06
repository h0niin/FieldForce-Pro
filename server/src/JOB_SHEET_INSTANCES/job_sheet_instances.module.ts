import { Module, forwardRef } from '@nestjs/common';
import { JobSheetInstancesController } from './job_sheet_instances.controller';
import { JobSheetInstancesService } from './job_sheet_instances.service';
import { jobSheetInstancesProviders } from './job_sheet_instances.provider';
import { workflowTemplatesProviders } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.provider';
import { DatabaseModule } from '../database/database.module';
import { DocumentApprovalsModule } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => DocumentApprovalsModule)],
  controllers: [JobSheetInstancesController],
  providers: [
    JobSheetInstancesService,
    ...jobSheetInstancesProviders,
    ...workflowTemplatesProviders,
  ],
  exports: [JobSheetInstancesService],
})
export class JobSheetInstancesModule {}
