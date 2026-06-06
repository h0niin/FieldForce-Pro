import { Timesheet } from './timesheets.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const timesheetsProviders = [
  {
    provide: KEYNAMES.TIMESHEETS,
    useValue: Timesheet,
  },
];
