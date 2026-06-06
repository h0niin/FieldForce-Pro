import { Module } from '@nestjs/common';
import { PaymentGatewaysController } from './payment_gateways.controller';
import { PaymentGatewaysService } from './payment_gateways.service';
import { paymentGatewaysProviders } from './payment_gateways.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentGatewaysController],
  providers: [PaymentGatewaysService, ...paymentGatewaysProviders],
  exports: [PaymentGatewaysService],
})
export class PaymentGatewaysModule {}
