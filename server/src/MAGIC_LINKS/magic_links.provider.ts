import { REPOSITORY } from '../shared/constants/keynames';
import { MagicLink } from './magic_links.entity';

export const magicLinksProviders = [
  { provide: REPOSITORY.MAGIC_LINKS, useValue: MagicLink },
];
