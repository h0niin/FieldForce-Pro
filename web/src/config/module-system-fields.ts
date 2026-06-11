/**
 * Static definitions of built-in system fields per module.
 * These fields are NOT in the `custom_fields` table — they are part of the
 * core entity schema. The layout editor shows them alongside custom fields
 * so admins can reorder them and customize their labels.
 *
 * When the user saves the layout, system field positions are stored in
 * `custom_fields` with `is_system = true` and `field_type = 'system'`.
 */

export interface SystemField {
  field_name: string;
  field_label: string;           // default display label
  field_type: 'system';
  is_system: true;
  is_required?: boolean;
  section_name: string;
  sort_order: number;
  section_order: number;
  /** Can the admin make it mandatory? */
  can_set_required?: boolean;
  /** Can the admin hide it? */
  can_hide?: boolean;
  /** Can the admin rename it? */
  can_rename?: boolean;
  /** Can admin set char_limit? */
  can_set_char_limit?: boolean;
}

export interface SystemFieldSection {
  section_name: string;
  section_order: number;
  fields: SystemField[];
}

const sysField = (
  field_name: string,
  field_label: string,
  section_name: string,
  sort_order: number,
  section_order = 0,
  opts: Partial<SystemField> = {},
): SystemField => ({
  field_name,
  field_label,
  field_type: 'system',
  is_system: true,
  section_name,
  sort_order,
  section_order,
  can_rename: true,
  can_hide: false,
  can_set_required: false,
  ...opts,
});

export const MODULE_SYSTEM_FIELDS: Record<string, SystemFieldSection[]> = {
  Contacts: [
    {
      section_name: 'Contact Details',
      section_order: 0,
      fields: [
        sysField('salutation', 'Salutation', 'Contact Details', 0, 0, { can_hide: true }),
        sysField('first_name', 'First Name', 'Contact Details', 1, 0, { is_required: true, can_set_required: false }),
        sysField('last_name', 'Last Name', 'Contact Details', 2, 0, { is_required: true, can_set_required: false }),
        sysField('email', 'Email', 'Contact Details', 3, 0, { can_set_required: true, can_hide: true }),
        sysField('phone', 'Phone', 'Contact Details', 4, 0, { can_set_required: true, can_hide: true }),
        sysField('mobile', 'Mobile', 'Contact Details', 5, 0, { can_hide: true }),
        sysField('company_id', 'Company', 'Contact Details', 6, 0, { can_hide: true }),
      ],
    },
    {
      section_name: 'Address',
      section_order: 1,
      fields: [
        sysField('service_address_id', 'Service Address', 'Address', 0, 1),
        sysField('billing_address_id', 'Billing Address', 'Address', 1, 1),
      ],
    },
  ],

  Companies: [
    {
      section_name: 'Company Details',
      section_order: 0,
      fields: [
        sysField('name', 'Company Name', 'Company Details', 0, 0, { is_required: true, can_set_required: false }),
        sysField('website', 'Website', 'Company Details', 1, 0, { can_hide: true }),
        sysField('email', 'Email', 'Company Details', 2, 0, { can_hide: true }),
        sysField('phone', 'Phone', 'Company Details', 3, 0, { can_hide: true }),
        sysField('mobile', 'Mobile', 'Company Details', 4, 0, { can_hide: true }),
        sysField('company_type', 'Company Type', 'Company Details', 5, 0, { can_hide: true }),
      ],
    },
    {
      section_name: 'Address',
      section_order: 1,
      fields: [
        sysField('service_address_id', 'Service Address', 'Address', 0, 1),
        sysField('billing_address_id', 'Billing Address', 'Address', 1, 1),
      ],
    },
  ],

  'Service Requests': [
    {
      section_name: 'Request Details',
      section_order: 0,
      fields: [
        sysField('title', 'Subject', 'Request Details', 0, 0, { is_required: true, can_set_required: false, can_rename: true }),
        sysField('status', 'Status', 'Request Details', 1, 0),
        sysField('priority', 'Priority', 'Request Details', 2, 0, { can_hide: true }),
        sysField('contact_id', 'Contact', 'Request Details', 3, 0, { can_hide: true }),
        sysField('company_id', 'Company', 'Request Details', 4, 0, { can_hide: true }),
        sysField('description', 'Description', 'Request Details', 5, 0, { can_hide: true }),
        sysField('due_date', 'Due Date', 'Request Details', 6, 0, { can_hide: true }),
        sysField('assigned_to', 'Assigned To', 'Request Details', 7, 0, { can_hide: true }),
      ],
    },
  ],

  'Work Orders': [
    {
      section_name: 'Work Order Details',
      section_order: 0,
      fields: [
        sysField('title', 'Subject', 'Work Order Details', 0, 0, { is_required: true }),
        sysField('status', 'Status', 'Work Order Details', 1, 0),
        sysField('priority', 'Priority', 'Work Order Details', 2, 0, { can_hide: true }),
        sysField('contact_id', 'Contact', 'Work Order Details', 3, 0, { can_hide: true }),
        sysField('company_id', 'Company', 'Work Order Details', 4, 0, { can_hide: true }),
        sysField('description', 'Description', 'Work Order Details', 5, 0, { can_hide: true }),
        sysField('scheduled_start', 'Scheduled Start', 'Work Order Details', 6, 0, { can_hide: true }),
        sysField('scheduled_end', 'Scheduled End', 'Work Order Details', 7, 0, { can_hide: true }),
        sysField('assigned_to', 'Assigned To', 'Work Order Details', 8, 0, { can_hide: true }),
      ],
    },
  ],

  'Service Appointments': [
    {
      section_name: 'Appointment Details',
      section_order: 0,
      fields: [
        sysField('work_order_id', 'Work Order', 'Appointment Details', 0, 0, { is_required: true }),
        sysField('status', 'Status', 'Appointment Details', 1, 0),
        sysField('scheduled_start', 'Start Time', 'Appointment Details', 2, 0),
        sysField('scheduled_end', 'End Time', 'Appointment Details', 3, 0),
        sysField('assigned_to', 'Assigned To', 'Appointment Details', 4, 0),
      ],
    },
  ],

  Assets: [
    {
      section_name: 'Asset Details',
      section_order: 0,
      fields: [
        sysField('name', 'Asset Name', 'Asset Details', 0, 0, { is_required: true }),
        sysField('serial_number', 'Serial Number', 'Asset Details', 1, 0, { can_hide: true }),
        sysField('model', 'Model', 'Asset Details', 2, 0, { can_hide: true }),
        sysField('manufacturer', 'Manufacturer', 'Asset Details', 3, 0, { can_hide: true }),
        sysField('status', 'Status', 'Asset Details', 4, 0),
        sysField('contact_id', 'Contact', 'Asset Details', 5, 0, { can_hide: true }),
        sysField('company_id', 'Company', 'Asset Details', 6, 0, { can_hide: true }),
        sysField('install_date', 'Install Date', 'Asset Details', 7, 0, { can_hide: true }),
        sysField('warranty_expiry', 'Warranty Expiry', 'Asset Details', 8, 0, { can_hide: true }),
      ],
    },
  ],

  Estimates: [
    {
      section_name: 'Estimate Details',
      section_order: 0,
      fields: [
        sysField('estimate_number', 'Estimate Number', 'Estimate Details', 0, 0),
        sysField('status', 'Status', 'Estimate Details', 1, 0),
        sysField('contact_id', 'Contact', 'Estimate Details', 2, 0),
        sysField('company_id', 'Company', 'Estimate Details', 3, 0, { can_hide: true }),
        sysField('valid_until', 'Valid Until', 'Estimate Details', 4, 0, { can_hide: true }),
        sysField('notes', 'Notes', 'Estimate Details', 5, 0, { can_hide: true }),
      ],
    },
  ],

  Invoices: [
    {
      section_name: 'Invoice Details',
      section_order: 0,
      fields: [
        sysField('invoice_number', 'Invoice Number', 'Invoice Details', 0, 0),
        sysField('status', 'Status', 'Invoice Details', 1, 0),
        sysField('contact_id', 'Contact', 'Invoice Details', 2, 0),
        sysField('company_id', 'Company', 'Invoice Details', 3, 0, { can_hide: true }),
        sysField('due_date', 'Due Date', 'Invoice Details', 4, 0, { can_hide: true }),
        sysField('notes', 'Notes', 'Invoice Details', 5, 0, { can_hide: true }),
      ],
    },
  ],

  'Services Catalog': [
    {
      section_name: 'Service Details',
      section_order: 0,
      fields: [
        sysField('name', 'Service Name', 'Service Details', 0, 0, { is_required: true }),
        sysField('description', 'Description', 'Service Details', 1, 0, { can_hide: true }),
        sysField('unit_price', 'Unit Price', 'Service Details', 2, 0),
        sysField('duration', 'Duration', 'Service Details', 3, 0, { can_hide: true }),
        sysField('category', 'Category', 'Service Details', 4, 0, { can_hide: true }),
      ],
    },
  ],

  'Parts Catalog': [
    {
      section_name: 'Part Details',
      section_order: 0,
      fields: [
        sysField('name', 'Part Name', 'Part Details', 0, 0, { is_required: true }),
        sysField('sku', 'SKU', 'Part Details', 1, 0, { can_hide: true }),
        sysField('description', 'Description', 'Part Details', 2, 0, { can_hide: true }),
        sysField('unit_price', 'Unit Price', 'Part Details', 3, 0),
        sysField('quantity', 'Quantity', 'Part Details', 4, 0),
      ],
    },
  ],

  Timesheets: [
    {
      section_name: 'Timesheet Details',
      section_order: 0,
      fields: [
        sysField('work_order_id', 'Work Order', 'Timesheet Details', 0, 0),
        sysField('user_id', 'Technician', 'Timesheet Details', 1, 0),
        sysField('clock_in', 'Clock In', 'Timesheet Details', 2, 0),
        sysField('clock_out', 'Clock Out', 'Timesheet Details', 3, 0),
        sysField('notes', 'Notes', 'Timesheet Details', 4, 0, { can_hide: true }),
      ],
    },
  ],

  Users: [
    {
      section_name: 'User Details',
      section_order: 0,
      fields: [
        sysField('first_name', 'First Name', 'User Details', 0, 0, { is_required: true, can_set_required: false }),
        sysField('last_name', 'Last Name', 'User Details', 1, 0, { is_required: true, can_set_required: false }),
        sysField('email', 'Email', 'User Details', 2, 0, { is_required: true }),
        sysField('phone', 'Phone', 'User Details', 3, 0, { can_hide: true }),
        sysField('role', 'Role', 'User Details', 4, 0),
      ],
    },
  ],
};

/**
 * Returns all sections (system + empty placeholder for custom) for a given module.
 * Returns empty array if module has no system field definition.
 */
export function getSystemFieldsForModule(moduleName: string): SystemFieldSection[] {
  return MODULE_SYSTEM_FIELDS[moduleName] ?? [];
}
