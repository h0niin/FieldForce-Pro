import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { IoTDataController } from './iot_data.controller';
import { IoTDataService } from './iot_data.service';
import { IoTDataScheduler } from './iot_data.scheduler';
import { IOT_DATA_PROVIDERS } from './iot_data.provider';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [IoTDataController],
  providers: [IoTDataService, IoTDataScheduler, ...IOT_DATA_PROVIDERS],
  exports: [IoTDataService, ...IOT_DATA_PROVIDERS],
})
export class IoTDataModule {}
