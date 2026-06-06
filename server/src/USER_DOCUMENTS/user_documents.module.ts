import { Module } from '@nestjs/common';
import { UserDocumentsService } from './user_documents.service';
import { UserDocumentsController } from './user_documents.controller';
import { userDocumentsProviders } from './user_documents.provider';

@Module({
  controllers: [UserDocumentsController],
  providers: [UserDocumentsService, ...userDocumentsProviders],
  exports: [UserDocumentsService, ...userDocumentsProviders],
})
export class UserDocumentsModule {}
