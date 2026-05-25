import { Module, forwardRef } from '@nestjs/common';
import { WorkOrderTechnicianSessionsController } from './work_order_technician_sessions.controller';
import { WorkOrderTechnicianSessionsService } from './work_order_technician_sessions.service';
import { workOrderTechnicianSessionsProviders } from './work_order_technician_sessions.provider';
import { serviceAppointmentsProviders } from '../SERVICE_APPOINTMENTS/service_appointments.provider';
import { DatabaseModule } from '../database/database.module';
import { WorkOrdersModule } from '../WORK_ORDERS/work_orders.module';
import { NotificationsModule } from '../NOTIFICATIONS/notifications.module';
import { UsersModule } from '../USERS/users.module';
import { TripsModule } from '../TRIPS/trips.module';
import { SlaTimersModule } from '../SLA_TIMERS/sla_timers.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => WorkOrdersModule), NotificationsModule, UsersModule, TripsModule, SlaTimersModule],
  controllers: [WorkOrderTechnicianSessionsController],
  providers: [WorkOrderTechnicianSessionsService, ...workOrderTechnicianSessionsProviders, ...serviceAppointmentsProviders],
  exports: [WorkOrderTechnicianSessionsService],
})
export class WorkOrderTechnicianSessionsModule {}
