import { ScheduledReport } from './scheduled_reports.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const scheduledReportsProviders = [
  {
    provide: KEYNAMES.SCHEDULED_REPORTS,
    useValue: ScheduledReport,
  },
];
