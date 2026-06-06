import { AssetMaintenancePlan } from './asset_maintenance_plans.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const assetMaintenancePlansProviders = [
  {
    provide: KEYNAMES.ASSET_MAINTENANCE_PLANS,
    useValue: AssetMaintenancePlan,
  },
];
