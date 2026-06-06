import { SubscriptionPlan } from './subscription_plans.entity';
import { REPOSITORY } from '../shared/constants/keynames';

export const subscriptionPlansProviders = [
  {
    provide: REPOSITORY.SUBSCRIPTION_PLANS,
    useValue: SubscriptionPlan,
  },
];
