import { Module } from '@nestjs/common';
import { PricebookController } from './pricebook.controller';
import { PricebookService } from './pricebook.service';
import { pricebookProviders } from './pricebook.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PricebookController],
  providers: [PricebookService, ...pricebookProviders],
  exports: [PricebookService],
})
export class PricebookModule {}
