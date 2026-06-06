import { Module, forwardRef } from '@nestjs/common';
import { SCHEDULINGController } from './scheduling.controller';
import { SCHEDULINGService } from './scheduling.service';
import { SCHEDULING_PROVIDERS } from './scheduling.provider';
import { ConfigModule } from '@nestjs/config';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { User } from '../USERS/users.entity';

const WORK_ORDERS_PROVIDER = {
  provide: 'WORK_ORDERS_REPOSITORY',
  useValue: WorkOrder,
};

const SERVICE_APPOINTMENTS_PROVIDER = {
  provide: 'SERVICE_APPOINTMENTS_REPOSITORY',
  useValue: ServiceAppointment,
};

const USERS_PROVIDER = {
  provide: 'USERS_REPOSITORY',
  useValue: User,
};

@Module({
  imports: [ConfigModule],
  controllers: [SCHEDULINGController],
  providers: [
    SCHEDULINGService,
    ...SCHEDULING_PROVIDERS,
    WORK_ORDERS_PROVIDER,
    SERVICE_APPOINTMENTS_PROVIDER,
    USERS_PROVIDER,
  ],
  exports: [SCHEDULINGService, ...SCHEDULING_PROVIDERS],
})
export class SCHEDULINGModule {}