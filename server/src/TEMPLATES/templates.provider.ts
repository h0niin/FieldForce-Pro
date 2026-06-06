import { Template } from './templates.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const templatesProviders = [
  {
    provide: KEYNAMES.TEMPLATES,
    useValue: Template,
  },
];
