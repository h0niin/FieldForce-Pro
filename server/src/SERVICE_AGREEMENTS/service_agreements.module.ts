import { Module } from '@nestjs/common';
import { ServiceAgreementsController } from './service_agreements.controller';
import { ServiceAgreementsService } from './service_agreements.service';
import { serviceAgreementsProviders } from './service_agreements.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ServiceAgreementsController],
  providers: [ServiceAgreementsService, ...serviceAgreementsProviders],
  exports: [ServiceAgreementsService],
})
export class ServiceAgreementsModule {}
