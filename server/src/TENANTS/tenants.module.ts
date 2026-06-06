import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { tenantsProviders } from './tenants.provider';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, ...tenantsProviders],
  exports: [TenantsService, ...tenantsProviders],
})
export class TenantsModule {}
