import { WebformSubmission } from './webform-submissions.entity';

export const webformSubmissionsProvider = {
  provide: 'WebformSubmissionsRepository',
  useValue: WebformSubmission,
};