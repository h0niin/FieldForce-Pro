import { Module } from '@nestjs/common';
import { ScheduledReportsController } from './scheduled_reports.controller';
import { ScheduledReportsService } from './scheduled_reports.service';
import { scheduledReportsProviders } from './scheduled_reports.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ScheduledReportsController],
  providers: [ScheduledReportsService, ...scheduledReportsProviders],
  exports: [ScheduledReportsService],
})
export class ScheduledReportsModule {}
