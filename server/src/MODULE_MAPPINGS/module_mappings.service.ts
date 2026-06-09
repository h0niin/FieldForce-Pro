import { Injectable, Inject } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { ModuleMapping } from './module_mappings.entity';
import { CustomField } from '../CUSTOM_FIELDS/custom_fields.entity';
import { MODULE_STANDARD_FIELDS } from '../FIELD_PERMISSIONS/field_permissions.service';
import { SaveModuleMappingsDto } from './dto/module_mappings.dto';

const STANDARD_FIELD_TYPES: Record<string, string> = {
  first_name: 'text',
  last_name: 'text',
  email: 'email',
  phone: 'phone',
  mobile: 'phone',
  company: 'lookup',
  description: 'textarea',
  name: 'text',
  website: 'url',
  billing_address: 'textarea',
  shipping_address: 'textarea',
  code: 'text',
  sku: 'text',
  price: 'currency',
  category: 'text',
  serial_number: 'text',
  status: 'dropdown',
  installation_date: 'date',
  subject: 'text',
  priority: 'dropdown',
  estimate_number: 'text',
  date: 'date',
  total_amount: 'currency',
  work_order_number: 'text',
  scheduled_date: 'date',
  appointment_number: 'text',
  start_time: 'date',
  end_time: 'date',
  is_active: 'checkbox',
  amount: 'currency',
  payment_method: 'dropdown',
  timesheet_number: 'text',
};

const DEFAULT_MAPPINGS: Record<string, { source: string; target: string }[]> = {
  'Service Requests -> Work Orders': [
    { source: 'asset', target: 'asset' },
    { source: 'company', target: 'company' },
    { source: 'contact', target: 'contact' },
    { source: 'description', target: 'description' },
    { source: 'subject', target: 'subject' },
    { source: 'priority', target: 'priority' },
  ],
  'Estimates -> Work Orders': [
    { source: 'subject', target: 'subject' },
    { source: 'description', target: 'description' },
    { source: 'total_amount', target: 'total_amount' },
    { source: 'contact', target: 'contact' },
    { source: 'company', target: 'company' },
  ],
  'Service Requests -> Estimates': [
    { source: 'subject', target: 'subject' },
    { source: 'description', target: 'description' },
    { source: 'contact', target: 'contact' },
    { source: 'company', target: 'company' },
  ],
  'Work Orders -> Estimates': [
    { source: 'subject', target: 'subject' },
    { source: 'description', target: 'description' },
  ],
  'Work Orders -> Work Orders': [
    { source: 'subject', target: 'subject' },
    { source: 'description', target: 'description' },
    { source: 'status', target: 'status' },
  ],
  'Work Orders -> Service Appointments': [
    { source: 'subject', target: 'subject' },
    { source: 'description', target: 'description' },
  ],
  'Service Appointments -> Job Sheets': [
    { source: 'subject', target: 'name' },
    { source: 'description', target: 'description' },
  ],
};

@Injectable()
export class ModuleMappingsService {
  constructor(
    @Inject(KEYNAMES.MODULE_MAPPINGS)
    private readonly moduleMappingRepository: typeof ModuleMapping,
    @Inject(KEYNAMES.CUSTOM_FIELDS)
    private readonly customFieldRepository: typeof CustomField,
  ) {}

  async getFieldsForModule(tenantId: string, moduleName: string) {
    const standard = MODULE_STANDARD_FIELDS[moduleName] || [];
    const standardWithTypes = standard.map((f) => ({
      name: f.name,
      label: f.label,
      type: STANDARD_FIELD_TYPES[f.name] || 'text',
      isCustom: false,
    }));

    const custom = await this.customFieldRepository.findAll({
      where: { tenant_id: tenantId, module: moduleName, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });
    const customWithTypes = custom.map((cf) => ({
      name: cf.field_name,
      label: cf.field_name,
      type: cf.field_type,
      isCustom: true,
    }));

    return [...standardWithTypes, ...customWithTypes];
  }

  async getMappings(tenantId: string, sourceModule: string, targetModule: string) {
    const mappings = await this.moduleMappingRepository.findAll({
      where: {
        tenant_id: tenantId,
        source_module: sourceModule,
        target_module: targetModule,
      },
      order: [['created_at', 'ASC']],
    });

    if (mappings.length > 0) {
      return mappings;
    }

    // Fallback to defaults
    const key = `${sourceModule} -> ${targetModule}`;
    const defaults = DEFAULT_MAPPINGS[key] || [];
    return defaults.map((d) => ({
      source_field: d.source,
      target_field: d.target,
    }));
  }

  async saveMappings(tenantId: string, dto: SaveModuleMappingsDto) {
    const { sourceModule, targetModule, mappings } = dto;

    // Delete existing mappings first
    await this.moduleMappingRepository.destroy({
      where: {
        tenant_id: tenantId,
        source_module: sourceModule,
        target_module: targetModule,
      },
    });

    // Create new mapping items
    const records = mappings.map((m) => ({
      tenant_id: tenantId,
      source_module: sourceModule,
      target_module: targetModule,
      source_field: m.source_field,
      target_field: m.target_field,
    }));

    await this.moduleMappingRepository.bulkCreate(records);

    return this.getMappings(tenantId, sourceModule, targetModule);
  }

  async resetMappings(tenantId: string, sourceModule: string, targetModule: string) {
    await this.moduleMappingRepository.destroy({
      where: {
        tenant_id: tenantId,
        source_module: sourceModule,
        target_module: targetModule,
      },
    });

    return this.getMappings(tenantId, sourceModule, targetModule);
  }
}
