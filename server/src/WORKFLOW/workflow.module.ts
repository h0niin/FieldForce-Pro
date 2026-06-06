import { Module } from '@nestjs/common';
import { WorkflowTemplatesModule } from './WORKFLOW_TEMPLATES/workflow_templates.module';
import { DocumentApprovalsModule } from './WORKFLOW_DOCUMENT_APPROVALS/document_approvals.module';

@Module({
  imports: [WorkflowTemplatesModule, DocumentApprovalsModule],
  exports: [WorkflowTemplatesModule, DocumentApprovalsModule],
})
export class WorkflowModule {}
