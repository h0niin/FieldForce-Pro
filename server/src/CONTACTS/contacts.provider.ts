import { REPOSITORY } from '../shared/constants/keynames';
import { Contact } from './contacts.entity';

export const contactsProviders = [
  {
    provide: REPOSITORY.CONTACTS,
    useValue: Contact,
  },
];
