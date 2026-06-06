import { Injectable, Inject } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Location } from '../LOCATIONS/locations.entity';
import { Op } from 'sequelize';

@Injectable()
export class LookupsService {
  constructor(
    @Inject(KEYNAMES.CATEGORIES) private categoryRepo: typeof Category,
    @Inject(KEYNAMES.SUB_CATEGORIES) private subCategoryRepo: typeof SubCategory,
    @Inject(KEYNAMES.PRIORITIES) private priorityRepo: typeof Priority,
    @Inject(KEYNAMES.LOCATIONS) private locationRepo: typeof Location,
  ) {}

  async getCategories(tenantId: string) {
    return this.categoryRepo.findAll({ where: { tenant_id: { [Op.or]: [tenantId, null] } } });
  }

  async getSubCategories(tenantId: string, categoryId?: string) {
    const where: any = { tenant_id: { [Op.or]: [tenantId, null] } };
    if (categoryId) {
      where.category_id = categoryId;
    }
    return this.subCategoryRepo.findAll({ where });
  }

  async getPriorities(tenantId: string) {
    return this.priorityRepo.findAll({ where: { tenant_id: { [Op.or]: [tenantId, null] } } });
  }

  async getLocations(tenantId: string) {
    return this.locationRepo.findAll({ where: { tenant_id: { [Op.or]: [tenantId, null] } } });
  }
}
