import { WorkflowRule } from './workflow_rules.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const workflowRulesProviders = [
  {
    provide: KEYNAMES.WORKFLOW_RULES,
    useValue: WorkflowRule,
  },
];
