import { REPOSITORY } from '../shared/constants/keynames';
import { SlaTimer } from './sla_timers.entity';

export const slaTimersProviders = [
  {
    provide: REPOSITORY.SLA_TIMERS,
    useValue: SlaTimer,
  },
];
