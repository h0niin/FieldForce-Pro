import { DispatchConsoleLayout } from './dispatch_console_layouts.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const dispatchConsoleLayoutsProviders = [
  {
    provide: KEYNAMES.DISPATCH_CONSOLE_LAYOUTS,
    useValue: DispatchConsoleLayout,
  },
];
