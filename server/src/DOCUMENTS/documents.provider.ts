import { ParsedDocument } from './documents.entity';

export const DOCUMENTS_PROVIDERS = [
  {
    provide: 'DOCUMENTS_REPOSITORY',
    useValue: ParsedDocument,
  },
];
