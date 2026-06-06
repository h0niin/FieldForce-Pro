import { Review } from './reviews.entity';
import { KEYNAMES } from '../shared/constants/keynames';

export const reviewsProviders = [
  {
    provide: KEYNAMES.REVIEWS,
    useValue: Review,
  },
];
