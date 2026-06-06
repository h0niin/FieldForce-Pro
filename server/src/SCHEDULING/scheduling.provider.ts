import { SCHEDULING } from './scheduling.entity';

export const SCHEDULING_PROVIDERS = [
  {
    provide: 'SCHEDULING_REPOSITORY',
    useValue: SCHEDULING,
  },
];