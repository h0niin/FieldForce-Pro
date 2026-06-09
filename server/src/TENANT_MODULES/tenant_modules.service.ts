import { Injectable, Inject } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { TenantModule } from './tenant_modules.entity';
import { ToggleTenantModuleDto } from './dto/tenant_modules.dto';
import { User } from '../USERS/users.entity';

// The canonical list of system modules — order matters (matches display order)
export const SYSTEM_MODULES = [
  'Contacts',
  'Companies',
  'Services And Parts',
  'Assets',
  'Requests',
  'Estimates',
  'Work Orders',
  'Service Appointments',
  'Service Reports',
  'Time Off',
  'Users',
  'Equipment',
  'Service Resource Skills',
  'Invoices',
  'Payments',
  'Timesheets',
];

@Injectable()
export class TenantModulesService {
  constructor(
    @Inject(KEYNAMES.TENANT_MODULES)
    private readonly tenantModuleRepository: typeof TenantModule,
  ) {}

  /**
   * Returns all modules for a tenant. If a module hasn't been saved yet
   * (tenant never toggled it), it is returned as active by default.
   */
  async findAll(tenantId: string): Promise<TenantModule[]> {
    const existing = await this.tenantModuleRepository.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: User, as: 'modifier', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    });

    // For any module not yet in DB, create a virtual "defaults active" record
    const existingNames = new Set(existing.map((m) => m.module_name));
    const missing = SYSTEM_MODULES.filter((name) => !existingNames.has(name));

    // Bulk-create missing entries so subsequent calls are faster
    if (missing.length > 0) {
      await this.tenantModuleRepository.bulkCreate(
        missing.map((name) => ({ tenant_id: tenantId, module_name: name, is_active: true })),
        { ignoreDuplicates: true },
      );
      // Re-fetch after seeding
      return this.tenantModuleRepository.findAll({
        where: { tenant_id: tenantId },
        include: [{ model: User, as: 'modifier', attributes: ['id', 'first_name', 'last_name', 'email'] }],
        order: [['module_name', 'ASC']],
      });
    }

    // Sort by canonical order
    return existing.sort(
      (a, b) => SYSTEM_MODULES.indexOf(a.module_name) - SYSTEM_MODULES.indexOf(b.module_name),
    );
  }

  async toggle(
    tenantId: string,
    moduleName: string,
    userId: string,
    dto: ToggleTenantModuleDto,
  ): Promise<TenantModule> {
    const [record] = await this.tenantModuleRepository.findOrCreate({
      where: { tenant_id: tenantId, module_name: moduleName },
      defaults: {
        tenant_id: tenantId,
        module_name: moduleName,
        is_active: dto.is_active,
        last_modified_by: userId,
      },
    });

    await record.update({ is_active: dto.is_active, last_modified_by: userId });
    await record.reload({
      include: [{ model: User, as: 'modifier', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    });
    return record;
  }
}
