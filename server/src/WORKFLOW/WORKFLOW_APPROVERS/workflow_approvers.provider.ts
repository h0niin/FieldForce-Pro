import { WorkflowApprover } from './workflow_approvers.entity';
import { KEYNAMES } from '../../shared/constants/keynames';

export const workflowApproversProviders = [
  {
    provide: KEYNAMES.WORKFLOW_APPROVERS,
    useValue: WorkflowApprover,
  },
];
