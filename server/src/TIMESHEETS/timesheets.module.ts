import { Module } from '@nestjs/common';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';
import { timesheetsProviders } from './timesheets.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TimesheetsController],
  providers: [TimesheetsService, ...timesheetsProviders],
  exports: [TimesheetsService],
})
export class TimesheetsModule {}
