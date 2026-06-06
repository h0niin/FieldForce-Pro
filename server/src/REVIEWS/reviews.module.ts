import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { reviewsProviders } from './reviews.provider';
import { DatabaseModule } from '../database/database.module';
import { KEYNAMES } from '../shared/constants/keynames';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';

@Module({
  imports: [DatabaseModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    ...reviewsProviders,
    { provide: KEYNAMES.WORK_ORDERS, useValue: WorkOrder },
    { provide: KEYNAMES.WORK_ORDER_TECHNICIAN_SESSIONS, useValue: WorkOrderTechnicianSession },
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
