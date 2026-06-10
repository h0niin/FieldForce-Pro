import { AutomationAction } from './automation_actions.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const automationActionsProviders = [
  {
    provide: KEYNAMES.AUTOMATION_ACTIONS,
    useValue: AutomationAction,
  },
];
