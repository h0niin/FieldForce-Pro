import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { databaseProviders } from '../database/database.providers';

@Module({
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    ...databaseProviders,
  ],
})
export class AttachmentsModule {}
