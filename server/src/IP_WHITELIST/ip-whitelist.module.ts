import { Module } from '@nestjs/common';
import { IPWhitelistController } from './ip-whitelist.controller';
import { IPWhitelistService } from './ip-whitelist.service';
import { ipWhitelistProvider } from './ip-whitelist.provider';
import { tenantsProviders } from '../TENANTS/tenants.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [IPWhitelistController],
  providers: [IPWhitelistService, ipWhitelistProvider, ...tenantsProviders],
  exports: [IPWhitelistService],
})
export class IPWhitelistModule {}