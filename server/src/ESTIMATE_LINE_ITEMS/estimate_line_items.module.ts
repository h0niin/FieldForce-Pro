import { Module } from '@nestjs/common';
import { EstimateLineItemsController } from './estimate_line_items.controller';
import { EstimateLineItemsService } from './estimate_line_items.service';
import { estimateLineItemsProviders } from './estimate_line_items.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EstimateLineItemsController],
  providers: [EstimateLineItemsService, ...estimateLineItemsProviders],
  exports: [EstimateLineItemsService],
})
export class EstimateLineItemsModule {}
