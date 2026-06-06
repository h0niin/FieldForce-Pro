import { IoTData } from './iot_data.entity';

export const IOT_DATA_PROVIDERS = [
  {
    provide: 'IOT_DATA_REPOSITORY',
    useValue: IoTData,
  },
];
