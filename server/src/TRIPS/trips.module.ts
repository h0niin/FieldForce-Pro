import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { tripsProviders } from './trips.provider';
import { DatabaseModule } from '../database/database.module';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';
import { REPOSITORY } from '../shared/constants/keynames';

@Module({
  imports: [DatabaseModule],
  controllers: [TripsController],
  providers: [
    TripsService,
    ...tripsProviders,
    { provide: REPOSITORY.WORK_ORDER_TECHNICIAN_SESSIONS, useValue: WorkOrderTechnicianSession },
  ],
  exports: [TripsService],
})
export class TripsModule {}
