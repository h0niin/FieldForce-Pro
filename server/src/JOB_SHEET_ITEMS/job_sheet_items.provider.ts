import { JobSheetItem } from './job_sheet_items.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const jobSheetItemsProviders = [
  {
    provide: KEYNAMES.JOB_SHEET_ITEMS,
    useValue: JobSheetItem,
  },
];
