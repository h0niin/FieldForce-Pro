import { Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';
import { DatabaseModule } from '../database/database.module';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Location } from '../LOCATIONS/locations.entity';
import { KEYNAMES } from '../shared/constants/keynames';

const lookupsProviders = [
  { provide: KEYNAMES.CATEGORIES, useValue: Category },
  { provide: KEYNAMES.SUB_CATEGORIES, useValue: SubCategory },
  { provide: KEYNAMES.PRIORITIES, useValue: Priority },
  { provide: KEYNAMES.LOCATIONS, useValue: Location },
];

@Module({
  imports: [DatabaseModule],
  controllers: [LookupsController],
  providers: [LookupsService, ...lookupsProviders],
})
export class LookupsModule {}
