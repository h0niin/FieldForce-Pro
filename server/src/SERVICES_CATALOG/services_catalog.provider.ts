import { ServicesCatalog } from './services_catalog.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const servicesCatalogProviders = [
  {
    provide: KEYNAMES.SERVICES_CATALOG,
    useValue: ServicesCatalog,
  },
];
