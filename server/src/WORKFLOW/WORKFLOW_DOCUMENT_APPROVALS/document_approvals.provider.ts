import { DocumentApproval } from './document_approvals.entity';
import { KEYNAMES } from '../../shared/constants/keynames';

export const documentApprovalsProviders = [
  {
    provide: KEYNAMES.WORKFLOW_DOCUMENT_APPROVALS,
    useValue: DocumentApproval,
  },
];
