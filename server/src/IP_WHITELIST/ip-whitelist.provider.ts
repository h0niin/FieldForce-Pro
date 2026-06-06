import { IPWhitelist } from './ip-whitelist.entity';

export const ipWhitelistProvider = {
  provide: 'IPWhitelistRepository',
  useValue: IPWhitelist,
};