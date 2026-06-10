import { Module } from '@nestjs/common';
import { ServiceLocationsController } from './service_locations.controller';
import { ServiceLocationsService } from './service_locations.service';
import { serviceLocationsProviders } from './service_locations.provider';
import { DatabaseModule } from '../database/database.module';
import { ActivityLogsModule } from '../ACTIVITY_LOGS/activity_logs.module';

@Module({
  imports: [DatabaseModule, ActivityLogsModule],
  controllers: [ServiceLocationsController],
  providers: [ServiceLocationsService, ...serviceLocationsProviders],
  exports: [ServiceLocationsService],
})
export class ServiceLocationsModule {}
