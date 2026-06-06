import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { assetsProviders } from './assets.provider';
import { workOrdersProviders } from '../WORK_ORDERS/work_orders.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetsController],
  providers: [AssetsService, ...assetsProviders, ...workOrdersProviders],
  exports: [AssetsService],
})
export class AssetsModule {}
