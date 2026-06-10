import { TimeBasedRule } from './time_based_rules.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const timeBasedRulesProviders = [
  {
    provide: KEYNAMES.TIME_BASED_RULES,
    useValue: TimeBasedRule,
  },
];
