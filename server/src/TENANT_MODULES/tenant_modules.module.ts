import { Module } from '@nestjs/common';
import { TenantModulesController } from './tenant_modules.controller';
import { TenantModulesService } from './tenant_modules.service';
import { tenantModulesProviders } from './tenant_modules.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TenantModulesController],
  providers: [TenantModulesService, ...tenantModulesProviders],
  exports: [TenantModulesService],
})
export class TenantModulesModule {}
