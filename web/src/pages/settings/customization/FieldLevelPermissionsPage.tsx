import { useState, useEffect } from 'react';
import {
  Typography,
  Select,
  Button,
  Radio,
  Tooltip,
  Spin,
  Tag,
  Input,
} from 'antd';
import {
  SaveOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useFieldPermissions, useSaveFieldPermissions } from '@/hooks/use-field-permissions';
import { useAllRoles } from '@/hooks/use-roles';
import { useUiStore } from '@/store/ui.store';

const { Title, Text } = Typography;

const MODULES = [
  'Companies',
  'Contacts',
  'Work Orders',
  'Service Requests',
  'Service Appointments',
  'Estimates',
  'Assets',
  'Job Sheets',
  'Invoices',
  'Payments',
  'Timesheets',
  'Users',
  'Services Catalog',
  'Parts Catalog',
];

type AccessLevel = 'read_write' | 'read' | 'none';

interface FieldRow {
  field_name: string;
  label: string;
  is_custom: boolean;
  access_level: AccessLevel;
}

interface FieldSection {
  sectionName: string;
  fields: FieldRow[];
}

// Map module fields into visual sections (mimicking Zoho groupings)
function groupFieldsIntoSections(
  fields: { field_name: string; label: string; is_custom: boolean; permissions: Record<string, string> }[],
  roleId: string,
  moduleName: string,
): FieldSection[] {
  if (!fields.length) return [];

  const rows: FieldRow[] = fields.map((f) => ({
    field_name: f.field_name,
    label: f.label,
    is_custom: f.is_custom,
    access_level: (f.permissions[roleId] || 'read_write') as AccessLevel,
  }));

  // For Companies and similar, split into sections
  const piiFields = rows.filter((f) =>
    ['email', 'phone', 'mobile', 'billing_address', 'shipping_address'].includes(f.field_name),
  );
  const addressFields = rows.filter((f) =>
    ['address', 'street', 'city', 'state', 'zip', 'country', 'territory', 'location'].some((k) =>
      f.field_name.toLowerCase().includes(k),
    ),
  );
  const mainFields = rows.filter(
    (f) =>
      !piiFields.find((p) => p.field_name === f.field_name) &&
      !addressFields.find((a) => a.field_name === f.field_name),
  );

  const sections: FieldSection[] = [{ sectionName: moduleName, fields: mainFields }];
  if (piiFields.length) sections.push({ sectionName: 'PII Fields', fields: piiFields });
  if (addressFields.length) sections.push({ sectionName: 'Addresses', fields: addressFields });
  return sections.filter((s) => s.fields.length > 0);
}

export default function FieldLevelPermissionsPage() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [selectedModule, setSelectedModule] = useState<string>('Companies');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [overrides, setOverrides] = useState<Record<string, AccessLevel>>({});

  const { data: roles = [] } = useAllRoles();

  const { data: permData, isLoading } = useFieldPermissions(selectedModule);
  const savePermissions = useSaveFieldPermissions();

  // Auto-select first role when roles load
  useEffect(() => {
    if (roles.length && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // Reset overrides on module/role change
  useEffect(() => {
    setOverrides({});
  }, [selectedModule, selectedRoleId]);

  const sections = permData && selectedRoleId
    ? groupFieldsIntoSections(permData.fields, selectedRoleId, selectedModule)
    : [];

  // Apply search filter
  const filteredSections = sections
    .map((sec) => ({
      ...sec,
      fields: sec.fields.filter(
        (f) =>
          !search ||
          f.label.toLowerCase().includes(search.toLowerCase()) ||
          f.field_name.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((s) => s.fields.length > 0);

  const hasChanges = Object.keys(overrides).length > 0;

  const handleChange = (fieldName: string, value: AccessLevel) => {
    setOverrides((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = async () => {
    const permissions = Object.entries(overrides).map(([field_name, access_level]) => ({
      field_name,
      role_id: selectedRoleId,
      access_level,
    }));
    if (permissions.length) {
      await savePermissions.mutateAsync({ moduleName: selectedModule, permissions });
      setOverrides({});
    }
  };

  const getEffectiveLevel = (fieldName: string, defaultLevel: AccessLevel): AccessLevel => {
    return overrides[fieldName] ?? defaultLevel;
  };

  const borderColor = isDark ? '#303030' : '#e8e8e8';
  const headerBg = isDark ? '#1a1a1a' : '#f8f9fa';
  const tableBg = isDark ? '#141414' : '#ffffff';
  const rowHoverBg = isDark ? '#1f1f1f' : '#f5f5f5';
  const textPrimary = isDark ? '#e5e7eb' : '#1a1a2e';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: textPrimary }}>
          Field Level Permissions
        </Title>
        <Text style={{ color: textSecondary, fontSize: 13 }}>
          For a custom profile, manage access control to specific data fields by setting field-level permissions.
          By carefully managing these permissions, you can ensure that your data is accessible to only the intended users.
        </Text>
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Module Selector */}
        <Select
          value={selectedModule}
          onChange={(v) => setSelectedModule(v)}
          style={{ minWidth: 180 }}
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={MODULES.map((m) => ({ label: m, value: m }))}
        />

        {/* Role/Profile Selector */}
        <Select
          value={selectedRoleId || undefined}
          onChange={(v) => setSelectedRoleId(v)}
          style={{ minWidth: 160 }}
          placeholder="Select profile"
          options={roles.map((r) => ({ label: r.name, value: r.id }))}
          loading={!roles.length}
        />

        {/* Search */}
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 260, borderRadius: 8 }}
        />

        {/* Save Button */}
        <div style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            disabled={!hasChanges}
            loading={savePermissions.isPending}
            onClick={handleSave}
            style={{
              background: hasChanges ? '#00a86b' : undefined,
              borderColor: hasChanges ? '#00a86b' : undefined,
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Permission Matrix */}
      {isLoading || !selectedRoleId ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Spin size="large" />
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            overflow: 'hidden',
            background: tableBg,
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 140px 140px',
              background: headerBg,
              borderBottom: `1px solid ${borderColor}`,
              padding: '10px 20px',
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: 600, fontSize: 13, color: textSecondary }}>Fields</Text>
            <Text style={{ fontWeight: 600, fontSize: 13, color: '#00a86b', textAlign: 'center' }}>
              Read And Write
            </Text>
            <Text style={{ fontWeight: 600, fontSize: 13, color: textSecondary, textAlign: 'center' }}>
              Read-Only
            </Text>
            <Text style={{ fontWeight: 600, fontSize: 13, color: textSecondary, textAlign: 'center' }}>
              Don't Show
            </Text>
          </div>

          {filteredSections.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: textSecondary }}>
              No fields found
            </div>
          ) : (
            filteredSections.map((section, sIdx) => (
              <div key={sIdx}>
                {/* Section Header */}
                <div
                  style={{
                    padding: '10px 20px',
                    background: isDark ? '#1a1a2e' : '#f0f5ff',
                    borderBottom: `1px solid ${borderColor}`,
                    borderTop: sIdx > 0 ? `1px solid ${borderColor}` : undefined,
                  }}
                >
                  <Text strong style={{ fontSize: 13, color: isDark ? '#93c5fd' : '#2f54eb' }}>
                    {section.sectionName}
                  </Text>
                  {section.fields.some((f) => f.is_custom) && (
                    <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
                      Custom
                    </Tag>
                  )}
                </div>

                {/* Field Rows */}
                {section.fields.map((field, fIdx) => {
                  const effectiveLevel = getEffectiveLevel(field.field_name, field.access_level);
                  const isModified = overrides[field.field_name] !== undefined;

                  return (
                    <FieldPermissionRow
                      key={field.field_name}
                      field={field}
                      effectiveLevel={effectiveLevel}
                      isModified={isModified}
                      isLast={fIdx === section.fields.length - 1}
                      isDark={isDark}
                      borderColor={borderColor}
                      rowHoverBg={rowHoverBg}
                      textPrimary={textPrimary}
                      textSecondary={textSecondary}
                      onChange={handleChange}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00a86b' }} />
          <Text style={{ fontSize: 12, color: textSecondary }}>
            Read And Write — can view and edit
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#d9d9d9' }} />
          <Text style={{ fontSize: 12, color: textSecondary }}>
            Read-Only — can view, cannot edit
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f5222d' }} />
          <Text style={{ fontSize: 12, color: textSecondary }}>
            Don't Show — completely hidden
          </Text>
        </div>
        <Tooltip title="PII (Personally Identifiable Information) fields may require special handling under privacy regulations.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}>
            <QuestionCircleOutlined style={{ color: textSecondary }} />
            <Text style={{ fontSize: 12, color: textSecondary }}>What are PII Fields?</Text>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

// ─── Sub-component: individual field row ─────────────────────────────────────

interface FieldPermissionRowProps {
  field: FieldRow;
  effectiveLevel: AccessLevel;
  isModified: boolean;
  isLast: boolean;
  isDark: boolean;
  borderColor: string;
  rowHoverBg: string;
  textPrimary: string;
  textSecondary: string;
  onChange: (fieldName: string, value: AccessLevel) => void;
}

function FieldPermissionRow({
  field,
  effectiveLevel,
  isModified,
  isLast,
  isDark,
  borderColor,
  rowHoverBg,
  textPrimary,
  textSecondary,
  onChange,
}: FieldPermissionRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 140px 140px 140px',
        padding: '10px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${borderColor}`,
        background: hovered ? rowHoverBg : 'transparent',
        transition: 'background 0.15s',
        gap: 8,
        alignItems: 'center',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Field Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 13, color: textPrimary }}>
          {field.label}
        </Text>
        {field.is_custom && (
          <Tag color="geekblue" style={{ fontSize: 10, lineHeight: '16px', height: 16 }}>
            Custom
          </Tag>
        )}
        {isModified && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#fa8c16',
              flexShrink: 0,
            }}
            title="Modified"
          />
        )}
      </div>

      {/* Read And Write */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Radio
          checked={effectiveLevel === 'read_write'}
          onChange={() => onChange(field.field_name, 'read_write')}
          style={{
            '--ant-radio-button-checked-color': '#00a86b',
          } as React.CSSProperties}
        />
      </div>

      {/* Read-Only */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Radio
          checked={effectiveLevel === 'read'}
          onChange={() => onChange(field.field_name, 'read')}
        />
      </div>

      {/* Don't Show */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Radio
          checked={effectiveLevel === 'none'}
          onChange={() => onChange(field.field_name, 'none')}
        />
      </div>
    </div>
  );
}
