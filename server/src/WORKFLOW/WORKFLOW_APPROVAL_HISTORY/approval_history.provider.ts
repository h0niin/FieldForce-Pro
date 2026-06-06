import { ApprovalHistory } from './approval_history.entity';
import { KEYNAMES } from '../../shared/constants/keynames';

export const approvalHistoryProviders = [
  {
    provide: KEYNAMES.WORKFLOW_APPROVAL_HISTORY,
    useValue: ApprovalHistory,
  },
];
