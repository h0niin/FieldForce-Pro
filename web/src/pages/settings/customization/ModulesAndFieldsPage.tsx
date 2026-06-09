import { useState } from 'react';
import {
  Typography,
  Switch,
  Tooltip,
  Skeleton,
  Input,
  Tag,
  Dropdown,
  Button,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  MoreOutlined,
  FormOutlined,
  LockOutlined,
  AuditOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined,
  ToolOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  CarOutlined,
  PartitionOutlined,
  AppstoreOutlined,
  ShopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTenantModules, useToggleTenantModule } from '@/hooks/use-tenant-modules';
import { useCustomFields } from '@/hooks/use-custom-fields';
import type { TenantModuleRecord } from '@/api/tenant-modules.api';
import type { MenuProps } from 'antd';
import { useUiStore } from '@/store/ui.store';
import { Alert } from 'antd';

const { Title, Text } = Typography;

// Icon map per module name
const MODULE_ICONS: Record<string, React.ReactNode> = {
  'Contacts': <UserOutlined />,
  'Companies': <TeamOutlined />,
  'Services Catalog': <ShopOutlined />,
  'Parts Catalog': <AppstoreOutlined />,
  'Assets': <ToolOutlined />,
  'Service Requests': <FileTextOutlined />,
  'Estimates': <AuditOutlined />,
  'Work Orders': <FormOutlined />,
  'Service Appointments': <CalendarOutlined />,
  'Job Sheets': <AuditOutlined />,
  'Users': <UserOutlined />,
  'Invoices': <DollarOutlined />,
  'Payments': <DollarOutlined />,
  'Timesheets': <ClockCircleOutlined />,
};

// Color accents per module
const MODULE_COLORS: Record<string, { bg: string; icon: string }> = {
  'Contacts': { bg: '#e8f4fd', icon: '#1890ff' },
  'Companies': { bg: '#f0f9e8', icon: '#52c41a' },
  'Services Catalog': { bg: '#fff7e6', icon: '#fa8c16' },
  'Parts Catalog': { bg: '#e6fffb', icon: '#08979c' },
  'Assets': { bg: '#fff1f0', icon: '#f5222d' },
  'Service Requests': { bg: '#f9f0ff', icon: '#722ed1' },
  'Estimates': { bg: '#e6fffb', icon: '#13c2c2' },
  'Work Orders': { bg: '#f0f5ff', icon: '#2f54eb' },
  'Service Appointments': { bg: '#fff0f6', icon: '#eb2f96' },
  'Job Sheets': { bg: '#fcffe6', icon: '#7cb305' },
  'Users': { bg: '#e6f7ff', icon: '#096dd9' },
  'Invoices': { bg: '#f6ffed', icon: '#389e0d' },
  'Payments': { bg: '#feffe6', icon: '#9ba400' },
  'Timesheets': { bg: '#fff2e8', icon: '#d4380d' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface ModuleCardProps {
  record: TenantModuleRecord;
  customFieldCount: number;
  onToggle: (moduleName: string, active: boolean) => void;
  isToggling: boolean;
}

function ModuleCard({ record, customFieldCount, onToggle, isToggling }: ModuleCardProps) {
  const navigate = useNavigate();
  const icon = MODULE_ICONS[record.module_name] ?? <AppstoreOutlined />;
  const colors = MODULE_COLORS[record.module_name] ?? { bg: '#f5f5f5', icon: '#8c8c8c' };

  const modifierName = record.modifier
    ? `${record.modifier.first_name} ${record.modifier.last_name}`
    : '—';

  const menuItems: MenuProps['items'] = [
    {
      key: 'custom-fields',
      label: 'Manage Custom Fields',
      icon: <FormOutlined />,
      onClick: () => navigate(`/customization/custom-fields?module=${encodeURIComponent(record.module_name)}`),
    },
    {
      key: 'field-permissions',
      label: 'Field Permissions',
      icon: <LockOutlined />,
      onClick: () => navigate(`/settings/customization/modules/${encodeURIComponent(record.module_name)}/permissions`),
    },
    {
      key: 'view-details',
      label: 'View Details',
      icon: <EyeOutlined />,
      disabled: true,
    },
  ];

  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <div
      style={{
        background: isDark ? '#1f1f1f' : '#fff',
        borderRadius: 12,
        border: `1.5px solid ${
          isDark
            ? '#303030'
            : record.is_active
            ? '#e6f7ff'
            : '#f0f0f0'
        }`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        opacity: record.is_active ? 1 : 0.65,
        boxShadow: record.is_active
          ? isDark
            ? '0 1px 4px rgba(0,0,0,0.4)'
            : '0 1px 4px rgba(24,144,255,0.08)'
          : isDark
          ? '0 1px 2px rgba(0,0,0,0.2)'
          : '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = isDark
          ? '0 4px 16px rgba(0,0,0,0.6)'
          : '0 4px 16px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = record.is_active
          ? isDark
            ? '0 1px 4px rgba(0,0,0,0.4)'
            : '0 1px 4px rgba(24,144,255,0.08)'
          : isDark
          ? '0 1px 2px rgba(0,0,0,0.2)'
          : '0 1px 2px rgba(0,0,0,0.04)';
      }}
    >
      {/* Module Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: isDark ? `${colors.icon}20` : colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: colors.icon,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Module Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text strong style={{ fontSize: 14, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
            {record.module_name}
          </Text>
          {customFieldCount > 0 && (
            <Tag color="blue" style={{ fontSize: 11, lineHeight: '18px', height: 18 }}>
              {customFieldCount} custom {customFieldCount === 1 ? 'field' : 'fields'}
            </Tag>
          )}
          {!record.is_active && (
            <Tag color="default" style={{ fontSize: 11, lineHeight: '18px', height: 18 }}>
              Disabled
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            Modified: {formatRelativeTime(record.updated_at)}
          </Text>
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            By: {modifierName}
          </Text>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Tooltip title={record.is_active ? 'Disable module' : 'Enable module'}>
          <Switch
            checked={record.is_active}
            onChange={(checked) => onToggle(record.module_name, checked)}
            loading={isToggling}
            size="small"
          />
        </Tooltip>
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="small"
            style={{ color: '#8c8c8c' }}
          />
        </Dropdown>
      </div>
    </div>
  );
}

export default function ModulesAndFieldsPage() {
  const [search, setSearch] = useState('');
  const { data: modules, isLoading } = useTenantModules();
  const { data: customFieldsData } = useCustomFields({} as Record<string, unknown> & { page: number; take: number });
  const toggleModule = useToggleTenantModule();

  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  // Build custom field count per module
  const cfByModule: Record<string, number> = {};
  if (customFieldsData?.data) {
    for (const cf of customFieldsData.data as unknown as { module: string }[]) {
      cfByModule[cf.module] = (cfByModule[cf.module] || 0) + 1;
    }
  }

  const filtered = (modules ?? []).filter((m) =>
    m.module_name.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = (modules ?? []).filter((m) => m.is_active).length;
  const totalCount = (modules ?? []).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
              Modules &amp; Fields
            </Title>
            <Text style={{ color: isDark ? '#a3a3a3' : '#8c8c8c', fontSize: 13 }}>
              Enable or disable modules and manage their custom fields.
              Disabled modules are hidden from your workspace.
            </Text>
          </div>
          {!isLoading && (
            <div
              style={{
                background: isDark ? 'linear-gradient(135deg, #1890ff30, #1890ff10)' : 'linear-gradient(135deg, #1890ff15, #1890ff08)',
                border: isDark ? '1px solid #1890ff50' : '1px solid #1890ff30',
                borderRadius: 10,
                padding: '8px 16px',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <Text strong style={{ fontSize: 20, color: '#1890ff', display: 'block' }}>
                {activeCount}/{totalCount}
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#a3a3a3' : '#8c8c8c' }}>Modules Active</Text>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Search modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 340, borderRadius: 8 }}
        />
      </div>

      {/* Module List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} active paragraph={{ rows: 1 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty description="No modules found" style={{ marginTop: 60 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((mod) => (
            <ModuleCard
              key={mod.id}
              record={mod}
              customFieldCount={cfByModule[mod.module_name] ?? 0}
              onToggle={(moduleName, active) =>
                toggleModule.mutate({ moduleName, is_active: active })
              }
              isToggling={toggleModule.isPending}
            />
          ))}
        </div>
      )}

      <Alert
        message={
          <span style={{ fontSize: 12, color: isDark ? '#dfdfdf' : '#595959' }}>
            💡 <strong>Tip:</strong> Disabling a module hides it from the sidebar navigation and prevents new records from being created.
            Existing records remain accessible through the API and can be re-enabled anytime.
          </span>
        }
        type="warning"
        showIcon={false}
        style={{ marginTop: 24, borderRadius: 8 }}
      />
    </div>
  );
}
