import { Injectable, Inject } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { FieldPermission } from './field_permissions.entity';
import { Role } from '../ROLES/roles.entity';
import { CustomField } from '../CUSTOM_FIELDS/custom_fields.entity';
import { BatchUpdateFieldPermissionsDto } from './dto/field_permissions.dto';

// Standard fields per module
export const MODULE_STANDARD_FIELDS: Record<string, { name: string; label: string; isCustom: boolean }[]> = {
  'Contacts': [
    { name: 'first_name', label: 'First Name', isCustom: false },
    { name: 'last_name', label: 'Last Name', isCustom: false },
    { name: 'email', label: 'Email', isCustom: false },
    { name: 'phone', label: 'Phone', isCustom: false },
    { name: 'company', label: 'Company', isCustom: false },
    { name: 'description', label: 'Description', isCustom: false },
  ],
  'Companies': [
    { name: 'name', label: 'Company Name', isCustom: false },
    { name: 'email', label: 'Email', isCustom: false },
    { name: 'phone', label: 'Phone', isCustom: false },
    { name: 'website', label: 'Website', isCustom: false },
    { name: 'billing_address', label: 'Billing Address', isCustom: false },
    { name: 'shipping_address', label: 'Shipping Address', isCustom: false },
  ],
  'Services And Parts': [
    { name: 'name', label: 'Name', isCustom: false },
    { name: 'code', label: 'Code', isCustom: false },
    { name: 'type', label: 'Type', isCustom: false },
    { name: 'price', label: 'Price', isCustom: false },
    { name: 'description', label: 'Description', isCustom: false },
  ],
  'Assets': [
    { name: 'name', label: 'Asset Name', isCustom: false },
    { name: 'category', label: 'Category', isCustom: false },
    { name: 'serial_number', label: 'Serial Number', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
    { name: 'installation_date', label: 'Installation Date', isCustom: false },
  ],
  'Requests': [
    { name: 'subject', label: 'Subject', isCustom: false },
    { name: 'description', label: 'Description', isCustom: false },
    { name: 'priority', label: 'Priority', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
  ],
  'Estimates': [
    { name: 'estimate_number', label: 'Estimate Number', isCustom: false },
    { name: 'subject', label: 'Subject', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
    { name: 'date', label: 'Date', isCustom: false },
    { name: 'total_amount', label: 'Total Amount', isCustom: false },
  ],
  'Work Orders': [
    { name: 'work_order_number', label: 'Work Order Number', isCustom: false },
    { name: 'subject', label: 'Subject', isCustom: false },
    { name: 'priority', label: 'Priority', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
    { name: 'scheduled_date', label: 'Scheduled Date', isCustom: false },
  ],
  'Service Appointments': [
    { name: 'appointment_number', label: 'Appointment Number', isCustom: false },
    { name: 'subject', label: 'Subject', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
    { name: 'start_time', label: 'Start Time', isCustom: false },
    { name: 'end_time', label: 'End Time', isCustom: false },
  ],
  'Service Reports': [
    { name: 'report_number', label: 'Report Number', isCustom: false },
    { name: 'summary', label: 'Summary', isCustom: false },
    { name: 'signed_at', label: 'Signed At', isCustom: false },
  ],
  'Time Off': [
    { name: 'start_date', label: 'Start Date', isCustom: false },
    { name: 'end_date', label: 'End Date', isCustom: false },
    { name: 'reason', label: 'Reason', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
  ],
  'Users': [
    { name: 'first_name', label: 'First Name', isCustom: false },
    { name: 'last_name', label: 'Last Name', isCustom: false },
    { name: 'email', label: 'Email', isCustom: false },
    { name: 'is_active', label: 'Status', isCustom: false },
  ],
  'Equipment': [
    { name: 'name', label: 'Name', isCustom: false },
    { name: 'code', label: 'Code', isCustom: false },
    { name: 'type', label: 'Type', isCustom: false },
    { name: 'serial_number', label: 'Serial Number', isCustom: false },
  ],
  'Service Resource Skills': [
    { name: 'name', label: 'Name', isCustom: false },
    { name: 'description', label: 'Description', isCustom: false },
  ],
  'Invoices': [
    { name: 'invoice_number', label: 'Invoice Number', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
    { name: 'total_amount', label: 'Total Amount', isCustom: false },
  ],
  'Payments': [
    { name: 'payment_number', label: 'Payment Number', isCustom: false },
    { name: 'amount', label: 'Amount', isCustom: false },
    { name: 'payment_method', label: 'Payment Method', isCustom: false },
    { name: 'status', label: 'Status', isCustom: false },
  ],
  'Timesheets': [
    { name: 'timesheet_number', label: 'Timesheet Number', isCustom: false },
    { name: 'start_time', label: 'Start Time', isCustom: false },
    { name: 'end_time', label: 'End Time', isCustom: false },
  ],
};

@Injectable()
export class FieldPermissionsService {
  constructor(
    @Inject(KEYNAMES.FIELD_PERMISSIONS)
    private readonly fieldPermissionRepository: typeof FieldPermission,
    @Inject(KEYNAMES.ROLES)
    private readonly roleRepository: typeof Role,
    @Inject(KEYNAMES.CUSTOM_FIELDS)
    private readonly customFieldRepository: typeof CustomField,
  ) {}

  /**
   * Retrieves all fields (standard + custom) for a module and their permission matrix per role
   */
  async getPermissionsForModule(tenantId: string, moduleName: string) {
    // 1. Fetch roles
    const roles = await this.roleRepository.findAll({
      where: { tenant_id: tenantId },
      order: [['name', 'ASC']],
    });

    // 2. Fetch custom fields
    const customFields = await this.customFieldRepository.findAll({
      where: { tenant_id: tenantId, module: moduleName, is_deleted: false },
      order: [['sort_order', 'ASC']],
    });

    // 3. Define fields
    const standard = MODULE_STANDARD_FIELDS[moduleName] || [];
    const custom = customFields.map((cf) => ({
      name: cf.field_name,
      label: cf.field_name, // fallback or show field name as label
      isCustom: true,
    }));
    const allFields = [...standard, ...custom];

    // 4. Fetch existing permissions
    const permissions = await this.fieldPermissionRepository.findAll({
      where: { tenant_id: tenantId, module_name: moduleName },
    });

    // 5. Structure into response matrix
    // Row per field, column per role
    const matrix = allFields.map((field) => {
      const fieldRoles: Record<string, string> = {};
      for (const role of roles) {
        const matching = permissions.find(
          (p) => p.field_name === field.name && p.role_id === role.id,
        );
        fieldRoles[role.id] = matching ? matching.access_level : 'read_write';
      }
      return {
        field_name: field.name,
        label: field.label,
        is_custom: field.isCustom,
        permissions: fieldRoles,
      };
    });

    return {
      roles: roles.map((r) => ({ id: r.id, name: r.name, is_system: r.is_system })),
      fields: matrix,
    };
  }

  /**
   * Batch updates field permissions for a module
   */
  async savePermissions(tenantId: string, dto: BatchUpdateFieldPermissionsDto) {
    const { module_name, permissions } = dto;

    for (const perm of permissions) {
      const [record] = await this.fieldPermissionRepository.findOrCreate({
        where: {
          tenant_id: tenantId,
          module_name,
          field_name: perm.field_name,
          role_id: perm.role_id,
        },
        defaults: {
          tenant_id: tenantId,
          module_name,
          field_name: perm.field_name,
          role_id: perm.role_id,
          access_level: perm.access_level,
        },
      });

      await record.update({ access_level: perm.access_level });
    }

    return this.getPermissionsForModule(tenantId, module_name);
  }
}
