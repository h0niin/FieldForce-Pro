import { REPOSITORY } from '../shared/constants/keynames';
import { LoginSession } from './login_sessions.entity';

export const loginSessionsProviders = [
  {
    provide: REPOSITORY.LOGIN_SESSIONS,
    useValue: LoginSession,
  },
];
