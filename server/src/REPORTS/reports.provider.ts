import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { Invoice } from '../INVOICES/invoices.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Payment } from '../PAYMENTS/payments.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const reportsProviders = [
    {
        provide: KEYNAMES.WORK_ORDERS,
        useValue: WorkOrder,
    },
    {
        provide: KEYNAMES.INVOICES,
        useValue: Invoice,
    },
    {
        provide: KEYNAMES.SERVICE_APPOINTMENTS,
        useValue: ServiceAppointment,
    },
    {
        provide: KEYNAMES.SERVICE_REQUESTS,
        useValue: ServiceRequest,
    },
    {
        provide: KEYNAMES.PAYMENTS,
        useValue: Payment,
    },
];
