import { Module, forwardRef } from '@nestjs/common';
import { AutoAssignmentController } from './auto-assignment.controller';
import { AutoAssignmentService } from './auto-assignment.service';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../USERS/users.module';
import { WorkOrdersModule } from '../WORK_ORDERS/work_orders.module';
import { ServiceRequestsModule } from '../SERVICE_REQUESTS/service_requests.module';
import { ServiceAppointmentsModule } from '../SERVICE_APPOINTMENTS/service_appointments.module';
import { User } from '../USERS/users.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => UsersModule),
    forwardRef(() => WorkOrdersModule),
    forwardRef(() => ServiceRequestsModule),
    forwardRef(() => ServiceAppointmentsModule),
  ],
  controllers: [AutoAssignmentController],
  providers: [
    AutoAssignmentService,
    {
      provide: 'USERS',
      useValue: User,
    },
    {
      provide: 'WORK_ORDERS',
      useValue: WorkOrder,
    },
    {
      provide: 'SERVICE_REQUESTS',
      useValue: ServiceRequest,
    },
    {
      provide: 'SERVICE_APPOINTMENTS',
      useValue: ServiceAppointment,
    },
  ],
  exports: [AutoAssignmentService],
})
export class AutoAssignmentModule {}