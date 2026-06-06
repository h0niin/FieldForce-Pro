import { Module } from '@nestjs/common';
import { WorkflowTemplatesController } from './workflow_templates.controller';
import { WorkflowTemplatesService } from './workflow_templates.service';
import { workflowTemplatesProviders } from './workflow_templates.provider';
import { workflowApproversProviders } from '../WORKFLOW_APPROVERS/workflow_approvers.provider';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkflowTemplatesController],
  providers: [
    WorkflowTemplatesService,
    ...workflowTemplatesProviders,
    ...workflowApproversProviders,
  ],
  exports: [WorkflowTemplatesService],
})
export class WorkflowTemplatesModule {}
