import { REPOSITORY } from '../shared/constants/keynames';
import { UserDocument } from './user_documents.entity';

export const userDocumentsProviders = [
  {
    provide: REPOSITORY.USER_DOCUMENTS,
    useValue: UserDocument,
  },
];
