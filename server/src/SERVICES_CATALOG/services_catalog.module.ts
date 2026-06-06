import { Module } from '@nestjs/common';
import { ServicesCatalogController } from './services_catalog.controller';
import { ServicesCatalogService } from './services_catalog.service';
import { servicesCatalogProviders } from './services_catalog.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesCatalogController],
  providers: [ServicesCatalogService, ...servicesCatalogProviders],
  exports: [ServicesCatalogService],
})
export class ServicesCatalogModule {}
