import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { communicationProviders } from './communication.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, ...communicationProviders],
  exports: [CommunicationService],
})
export class CommunicationModule {}
