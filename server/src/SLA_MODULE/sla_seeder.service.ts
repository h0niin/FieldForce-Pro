import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { SlaPolicy } from './sla_policies.entity';
import { Category } from '../CATEGORIES/categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';

@Injectable()
export class SlaPolicySeederService implements OnModuleInit {
  private readonly logger = new Logger(SlaPolicySeederService.name);

  constructor(
    @Inject(KEYNAMES.SLA_POLICIES)
    private readonly slaPolicyRepository: typeof SlaPolicy,
    @Inject(KEYNAMES.CATEGORIES)
    private readonly categoryRepository: typeof Category,
    @Inject(KEYNAMES.PRIORITIES)
    private readonly priorityRepository: typeof Priority,
    @Inject(KEYNAMES.TENANTS)
    private readonly tenantRepository: typeof Tenant,
    @Inject(KEYNAMES.SUB_CATEGORIES)
    private readonly subCategoryRepository: typeof SubCategory,
  ) {}

  async onModuleInit() {
    try {
      await this.seedSlaPolicies();
    } catch (error) {
      this.logger.error(`Failed to seed SLA policies: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  private async seedSlaPolicies() {
    // 1. Get a tenant to seed for (for simplicity, we will just take the first one or a default one,
    // or iterate over all tenants if we want global seeding). We'll iterate over tenants.
    const tenants = await this.tenantRepository.findAll();
    if (tenants.length === 0) {
      this.logger.warn('No tenants found in the database. SlaPolicySeederService will skip seeding until a tenant is created.');
      return;
    }

    for (const tenant of tenants) {
      const tenantId = tenant.id;

      // 2. Check if policies already exist for this tenant
      const existingCount = await this.slaPolicyRepository.count({ where: { tenant_id: tenantId } });
      if (existingCount > 0) {
        continue; // Already seeded
      }

      this.logger.log(`Seeding SLA Policies & Lookups for tenant ${tenantId}...`);

      // 3. Fetch or Create Priority UUIDs dynamically
      const priorityNames = ['Urgent', 'High', 'Medium', 'Low'];
      const priorityMap: Record<string, string> = {};
      
      for (const name of priorityNames) {
        let p = await this.priorityRepository.findOne({ where: { name, tenant_id: tenantId } });
        if (!p) {
          p = await this.priorityRepository.create({ name, tenant_id: tenantId });
        }
        priorityMap[name] = p.id;
      }

      // 4. Seed Categories and SubCategories
      const categoryHierarchy = {
        'HVAC': ['AC Repair & Maintenance', 'Heating/Furnace Repair', 'Ventilation & Ductwork', 'Thermostat Configuration'],
        'Plumbing': ['Leak Detection & Repair', 'Water Heater Service', 'Drain & Sewer Cleaning', 'Pipe Installation', 'Fixture Installation'],
        'Electrical': ['Wiring & Rewiring', 'Breaker Panel Upgrades', 'Lighting Installation', 'Short Circuit Diagnostics', 'Generator Maintenance'],
        'Appliance Repair': ['Refrigerator/Freezer', 'Washer/Dryer', 'Oven/Stove', 'Dishwasher'],
        'General Maintenance': ['Drywall Repair', 'Carpentry', 'Painting', 'Locksmith Services'],
      };

      const categoryMap: Record<string, string> = {};

      for (const [catName, subCatNames] of Object.entries(categoryHierarchy)) {
        // Find or create parent category
        let category = await this.categoryRepository.findOne({ where: { name: catName, tenant_id: tenantId } });
        if (!category) {
          category = await this.categoryRepository.create({ name: catName, tenant_id: tenantId });
        }
        categoryMap[catName] = category.id;

        // Find or create sub-categories
        for (const subCatName of subCatNames) {
          let subCategory = await this.subCategoryRepository.findOne({ where: { name: subCatName, tenant_id: tenantId, category_id: category.id } });
          if (!subCategory) {
            await this.subCategoryRepository.create({
              name: subCatName,
              tenant_id: tenantId,
              category_id: category.id,
            });
          }
        }
      }

      // 5. Seed Matrix (Using the dynamically created UUIDs)
      await this.slaPolicyRepository.bulkCreate([
        {
          tenant_id: tenantId,
          name: 'Urgent HVAC',
          category_id: categoryMap['HVAC'],
          sub_category_id: null,
          priority_id: priorityMap['Urgent'],
          location_id: null,
          response_time_minutes: 30, // 30 mins
          resolution_time_minutes: 120, // 2 hours
        },
        {
          tenant_id: tenantId,
          name: 'Catch-All: Urgent',
          category_id: null,
          sub_category_id: null,
          priority_id: priorityMap['Urgent'],
          location_id: null,
          response_time_minutes: 60, // 1 hour
          resolution_time_minutes: 240, // 4 hours
        },
        {
          tenant_id: tenantId,
          name: 'Catch-All: High',
          category_id: null,
          sub_category_id: null,
          priority_id: priorityMap['High'],
          location_id: null,
          response_time_minutes: 120, // 2 hours
          resolution_time_minutes: 480, // 8 hours
        },
        {
          tenant_id: tenantId,
          name: 'Catch-All: Medium',
          category_id: null,
          sub_category_id: null,
          priority_id: priorityMap['Medium'],
          location_id: null,
          response_time_minutes: 240, // 4 hours
          resolution_time_minutes: 1440, // 24 hours
        },
        {
          tenant_id: tenantId,
          name: 'Catch-All: Low',
          category_id: null,
          sub_category_id: null,
          priority_id: priorityMap['Low'],
          location_id: null,
          response_time_minutes: 1440, // 24 hours
          resolution_time_minutes: 4320, // 72 hours
        },
      ]);
      
      this.logger.log(`Successfully seeded SLA Policies & Lookups for tenant ${tenantId}.`);
    }
  }
}
