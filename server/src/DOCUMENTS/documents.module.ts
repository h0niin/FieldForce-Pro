import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DOCUMENTS_PROVIDERS } from './documents.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, ...DOCUMENTS_PROVIDERS],
  exports: [DocumentsService, ...DOCUMENTS_PROVIDERS],
})
export class DocumentsModule {}
