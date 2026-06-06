import { PartsCatalog } from './parts_catalog.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const partsCatalogProviders = [
  {
    provide: KEYNAMES.PARTS_CATALOG,
    useValue: PartsCatalog,
  },
];
