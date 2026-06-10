import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { assetsProviders } from './assets.provider';
import { workOrdersProviders } from '../WORK_ORDERS/work_orders.provider';
import { DatabaseModule } from '../database/database.module';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [DatabaseModule, ActivityLogsModule],
  controllers: [AssetsController],
  providers: [AssetsService, ...assetsProviders, ...workOrdersProviders],
  exports: [AssetsService],
})
export class AssetsModule {}
