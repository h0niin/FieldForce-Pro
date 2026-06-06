import { Module, forwardRef } from '@nestjs/common';
import { SlaTimersController } from './sla_timers.controller';
import { SlaTimersService } from './sla_timers.service';
import { slaTimersProviders } from './sla_timers.provider';
import { DatabaseModule } from '../database/database.module';
import { workOrdersProviders } from '../WORK_ORDERS/work_orders.provider';
import { workOrderTechnicianSessionsProviders } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [SlaTimersController],
  providers: [
    SlaTimersService,
    ...slaTimersProviders,
    ...workOrdersProviders,
    ...workOrderTechnicianSessionsProviders,
  ],
  exports: [SlaTimersService],
})
export class SlaTimersModule {}
