import { Module } from '@nestjs/common';
import { AssetMaintenancePlansController } from './asset_maintenance_plans.controller';
import { AssetMaintenancePlansService } from './asset_maintenance_plans.service';
import { assetMaintenancePlansProviders } from './asset_maintenance_plans.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetMaintenancePlansController],
  providers: [AssetMaintenancePlansService, ...assetMaintenancePlansProviders],
  exports: [AssetMaintenancePlansService],
})
export class AssetMaintenancePlansModule {}
