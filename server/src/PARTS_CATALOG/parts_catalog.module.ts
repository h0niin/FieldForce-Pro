import { Module } from '@nestjs/common';
import { PartsCatalogController } from './parts_catalog.controller';
import { PartsCatalogService } from './parts_catalog.service';
import { partsCatalogProviders } from './parts_catalog.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PartsCatalogController],
  providers: [PartsCatalogService, ...partsCatalogProviders],
  exports: [PartsCatalogService],
})
export class PartsCatalogModule {}
