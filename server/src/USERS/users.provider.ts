import { REPOSITORY } from '../shared/constants/keynames';
import { User } from './users.entity';

export const usersProviders = [
  {
    provide: REPOSITORY.USERS,
    useValue: User,
  },
];
