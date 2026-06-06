import { JobSheetInstance } from './job_sheet_instances.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const jobSheetInstancesProviders = [
  {
    provide: KEYNAMES.JOB_SHEET_INSTANCES,
    useValue: JobSheetInstance,
  },
];
