import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { Tenant } from '../TENANTS/tenants.entity';

@Injectable()
export class LookupSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LookupSeederService.name);

  constructor(
    @InjectModel(Priority) private priorityModel: typeof Priority,
    @InjectModel(Category) private categoryModel: typeof Category,
    @InjectModel(SubCategory) private subCategoryModel: typeof SubCategory,
    @InjectModel(ServiceLocation) private serviceLocationModel: typeof ServiceLocation,
    @InjectModel(Tenant) private tenantModel: typeof Tenant,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Running Lookup Seeder...');
    try {
      await this.seedPriorities();
      await this.seedCategories();
      await this.cleanupMockLocations();
      this.logger.log('Lookup Seeder completed successfully.');
    } catch (error) {
      this.logger.error(`Error during lookup seeding: ${error.message}`);
    }
  }

  private async seedPriorities() {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    for (const p of priorities) {
      await this.priorityModel.findOrCreate({
        where: { name: p },
        defaults: { name: p },
      });
    }
  }

  private async seedCategories() {
    const categoriesData = {
      'HVAC': ['AC Installation', 'AC Repair', 'Heating System', 'Ventilation'],
      'Electrical': ['Wiring & Cables', 'Panel Upgrade', 'Lighting Configuration', 'Short Circuit'],
      'Plumbing': ['Pipe Leak', 'Drain Cleaning', 'Water Heater Repair'],
      'General Maintenance': ['Janitorial', 'Landscaping', 'Pest Control'],
    };

    for (const [catName, subCats] of Object.entries(categoriesData)) {
      const [category] = await this.categoryModel.findOrCreate({
        where: { name: catName },
        defaults: { name: catName },
      });

      for (const subName of subCats) {
        await this.subCategoryModel.findOrCreate({
          where: { name: subName, category_id: category.id },
          defaults: { name: subName, category_id: category.id },
        });
      }
    }
  }

  private async cleanupMockLocations() {
    this.logger.log('Cleaning up mock Service Locations...');
    const mockLocations = ['Headquarters - North Wing', 'Downtown Branch', 'Warehouse Alpha'];
    
    try {
      const deletedCount = await this.serviceLocationModel.destroy({
        where: {
          address: mockLocations,
        },
        force: true,
      });
      if (deletedCount > 0) {
        this.logger.log(`Successfully deleted ${deletedCount} mock Service Locations.`);
      } else {
        this.logger.log('No mock Service Locations found to clean up.');
      }
    } catch (err) {
      this.logger.error(`Error cleaning up mock locations: ${(err as Error).message}`);
    }
  }
}
