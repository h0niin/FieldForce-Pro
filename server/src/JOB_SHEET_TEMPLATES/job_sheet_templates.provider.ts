import { JobSheetTemplate } from './job_sheet_templates.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const jobSheetTemplatesProviders = [
  {
    provide: KEYNAMES.JOB_SHEET_TEMPLATES,
    useValue: JobSheetTemplate,
  },
];
