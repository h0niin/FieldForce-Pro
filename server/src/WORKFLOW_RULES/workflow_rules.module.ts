import { Module } from '@nestjs/common';
import { WorkflowRulesController } from './workflow_rules.controller';
import { WorkflowRulesService } from './workflow_rules.service';
import { WorkflowEngineService } from './workflow_engine.service';
import { workflowRulesProviders } from './workflow_rules.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkflowRulesController],
  providers: [WorkflowRulesService, WorkflowEngineService, ...workflowRulesProviders],
  exports: [WorkflowRulesService, WorkflowEngineService],
})
export class WorkflowRulesModule {}
