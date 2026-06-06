import { Module } from '@nestjs/common';
import { InvoiceLineItemsController } from './invoice_line_items.controller';
import { InvoiceLineItemsService } from './invoice_line_items.service';
import { invoiceLineItemsProviders } from './invoice_line_items.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InvoiceLineItemsController],
  providers: [InvoiceLineItemsService, ...invoiceLineItemsProviders],
  exports: [InvoiceLineItemsService],
})
export class InvoiceLineItemsModule {}
