import { Module } from '@nestjs/common';
import { ServiceRequestNotesController } from './service_request_notes.controller';
import { ServiceRequestNotesService } from './service_request_notes.service';
import { serviceRequestNotesProviders } from './service_request_notes.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ServiceRequestNotesController],
  providers: [ServiceRequestNotesService, ...serviceRequestNotesProviders],
  exports: [ServiceRequestNotesService],
})
export class ServiceRequestNotesModule {}
