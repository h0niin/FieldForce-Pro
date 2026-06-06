import { WorkOrderAttachment } from './work_order_attachments.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const workOrderAttachmentsProviders = [
  {
    provide: KEYNAMES.WORK_ORDER_ATTACHMENTS,
    useValue: WorkOrderAttachment,
  },
];
