import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { companiesProviders } from './companies.provider';
import { DatabaseModule } from '../database/database.module';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [DatabaseModule, ActivityLogsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, ...companiesProviders],
  exports: [CompaniesService],
})
export class CompaniesModule {}
