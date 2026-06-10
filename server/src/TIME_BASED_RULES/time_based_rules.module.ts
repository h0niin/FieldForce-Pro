import { Module } from '@nestjs/common';
import { TimeBasedRulesController } from './time_based_rules.controller';
import { TimeBasedRulesService } from './time_based_rules.service';
import { timeBasedRulesProviders } from './time_based_rules.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TimeBasedRulesController],
  providers: [TimeBasedRulesService, ...timeBasedRulesProviders],
  exports: [TimeBasedRulesService],
})
export class TimeBasedRulesModule {}
