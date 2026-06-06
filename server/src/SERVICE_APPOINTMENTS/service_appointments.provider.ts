import { ServiceAppointment } from './service_appointments.entity';
import { REPOSITORY } from '../shared/constants/keynames';

export const serviceAppointmentsProviders = [
  {
    provide: REPOSITORY.SERVICE_APPOINTMENTS,
    useValue: ServiceAppointment,
  },
];
