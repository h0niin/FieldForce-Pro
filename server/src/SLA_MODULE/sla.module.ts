import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SlaService } from './sla.service';
import { SlaConfigService } from './sla_config.service';
import { SlaConfigController } from './sla_config.controller';
import { SlaPolicySeederService } from './sla_seeder.service';
import { slaProviders } from './sla.providers';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Location } from '../LOCATIONS/locations.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import { SlaMonitorService } from './sla-monitor.service';
import { NotificationsModule } from '../NOTIFICATIONS/notifications.module';
import { UsersModule } from '../USERS/users.module';

const lookupProviders = [
  { provide: KEYNAMES.CATEGORIES, useValue: Category },
  { provide: KEYNAMES.SUB_CATEGORIES, useValue: SubCategory },
  { provide: KEYNAMES.PRIORITIES, useValue: Priority },
  { provide: KEYNAMES.LOCATIONS, useValue: Location },
  { provide: KEYNAMES.TENANTS, useValue: Tenant },
];

@Module({
  imports: [DatabaseModule, NotificationsModule, UsersModule],
  controllers: [SlaConfigController],
  providers: [SlaService, SlaConfigService, SlaPolicySeederService, SlaMonitorService, ...slaProviders, ...lookupProviders],
  exports: [SlaService, SlaConfigService, SlaMonitorService],
})
export class SlaModule {}
