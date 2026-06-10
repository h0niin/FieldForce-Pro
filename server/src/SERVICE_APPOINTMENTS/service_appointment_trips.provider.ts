import { ServiceAppointmentTrip } from './service_appointment_trips.entity';
import { REPOSITORY } from '../shared/constants/keynames';

export const serviceAppointmentTripsProviders = [
  {
    provide: REPOSITORY.SERVICE_APPOINTMENT_TRIPS,
    useValue: ServiceAppointmentTrip,
  },
];
