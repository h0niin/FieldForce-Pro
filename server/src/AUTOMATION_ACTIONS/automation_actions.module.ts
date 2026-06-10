import { Module } from '@nestjs/common';
import { AutomationActionsController } from './automation_actions.controller';
import { AutomationActionsService } from './automation_actions.service';
import { automationActionsProviders } from './automation_actions.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AutomationActionsController],
  providers: [AutomationActionsService, ...automationActionsProviders],
  exports: [AutomationActionsService],
})
export class AutomationActionsModule {}
