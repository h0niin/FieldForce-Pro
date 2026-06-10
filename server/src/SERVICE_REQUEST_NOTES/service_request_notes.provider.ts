import { ServiceRequestNote } from './service_request_notes.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const serviceRequestNotesProviders = [
  {
    provide: KEYNAMES.SERVICE_REQUEST_NOTES,
    useValue: ServiceRequestNote,
  },
];
