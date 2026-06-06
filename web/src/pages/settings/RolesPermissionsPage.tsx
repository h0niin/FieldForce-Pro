import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Tabs,
  Modal,
  Form,
  Input,
  Checkbox,
  Tooltip,
  Typography,
  Select,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/hooks/use-roles';
import {
  usePermissions,
  useAllPermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from '@/hooks/use-permissions';
import type { Role, Permission } from '@/types/models.types';
import { PermissionAction } from '@/types/enums';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;
const { TextArea } = Input;

const ACTION_OPTIONS = [
  { label: 'Create', value: PermissionAction.CREATE },
  { label: 'Read', value: PermissionAction.READ },
  { label: 'Update', value: PermissionAction.UPDATE },
  { label: 'Delete', value: PermissionAction.DELETE },
  { label: 'Manage', value: PermissionAction.MANAGE },
];

// Module options based on application features — all system modules
const MODULE_OPTIONS = [
  // Core
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Users', value: 'users' },
  { label: 'Roles', value: 'roles' },
  { label: 'Permissions', value: 'permissions' },
  { label: 'Tenants', value: 'tenants' },
  { label: 'Settings', value: 'settings' },
  // Customer
  { label: 'Contacts', value: 'contacts' },
  { label: 'Companies', value: 'companies' },
  { label: 'Service Locations', value: 'service_locations' },
  // Operations
  { label: 'Service Requests', value: 'service_requests' },
  { label: 'Estimates', value: 'estimates' },
  { label: 'Service Appointments', value: 'service_appointments' },
  { label: 'Scheduling', value: 'scheduling' },
  // Job Management
  { label: 'Job Sheets', value: 'job_sheets' },
  { label: 'Timesheets', value: 'timesheets' },
  { label: 'Trips', value: 'trips' },
  { label: 'Agent Locations', value: 'agent_locations' },
  // Financial
  { label: 'Invoices', value: 'invoices' },
  { label: 'Payments', value: 'payments' },
  { label: 'Payment Gateways', value: 'payment_gateways' },
  { label: 'Service Agreements', value: 'service_agreements' },
  { label: 'Pricebook', value: 'pricebook' },
  // Catalog
  { label: 'Services Catalog', value: 'services_catalog' },
  { label: 'Parts Catalog', value: 'parts_catalog' },
  { label: 'Maintenance Plans', value: 'asset_maintenance_plans' },
  { label: 'Assets', value: 'assets' },
  // Communication
  { label: 'Notifications', value: 'notifications' },
  { label: 'Communications', value: 'communications' },
  { label: 'Webforms', value: 'webforms' },
  { label: 'Reviews', value: 'reviews' },
  // Automation
  { label: 'Blueprints', value: 'blueprint_definitions' },
  { label: 'Blueprint States', value: 'blueprint_states' },
  { label: 'Blueprint Transitions', value: 'blueprint_transitions' },
  { label: 'Custom Fields', value: 'custom_fields' },
  { label: 'Templates', value: 'templates' },
  { label: 'Workflow Rules', value: 'workflow_rules' },
  { label: 'Webhooks', value: 'webhooks' },
  // Reports
  { label: 'Reports', value: 'reports' },
  { label: 'Dashboards', value: 'dashboards' },
  { label: 'Audit Logs', value: 'audit_logs' },
  { label: 'Workforce', value: 'workforce' },
  // AI
  { label: 'Chatbot', value: 'chatbot' },
  { label: 'Documents', value: 'documents' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'Vision', value: 'vision' },
  { label: 'Voice', value: 'voice' },
  { label: 'IoT Data', value: 'iot_data' },
  { label: 'Scheduling AI', value: 'scheduling_ai' },
  // Portal
  { label: 'Portal', value: 'portal' },
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'] as const;

interface PermissionsMatrixProps {
  value?: string[];
  onChange?: (ids: string[]) => void;
  allPermissions: Permission[];
  moduleOptions: { label: string; value: string }[];
}

function PermissionsMatrix({ value = [], onChange, allPermissions, moduleOptions }: PermissionsMatrixProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // Group permissions by module, deduplicated by action
  const grouped = useMemo(() => {
    const result: Record<string, Record<string, string>> = {};
    for (const p of allPermissions) {
      if (!result[p.module]) result[p.module] = {};
      if (!result[p.module][p.action]) result[p.module][p.action] = p.id;
    }
    return result;
  }, [allPermissions]);

  const selectedSet = new Set(value);

  const filteredModules = Object.keys(grouped).filter((m) =>
    (moduleOptions.find((o) => o.value === m)?.label || m)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange?.(Array.from(next));
  };

  const toggleModule = (module: string, checked: boolean) => {
    const next = new Set(selectedSet);
    for (const id of Object.values(grouped[module])) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    onChange?.(Array.from(next));
  };

  const toggleAll = (checked: boolean) => {
    onChange?.(checked ? allPermissions.map((p) => p.id) : []);
  };

  const isModuleAllChecked = (module: string) =>
    Object.values(grouped[module]).every((id) => selectedSet.has(id));

  const isModulePartial = (module: string) =>
    Object.values(grouped[module]).some((id) => selectedSet.has(id)) &&
    !isModuleAllChecked(module);

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
        <Input
          placeholder={t('rolesPermissions.matrix.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 200 }}
          size="small"
        />
        <Space size={6}>
          <span style={{ fontSize: 12, opacity: 0.5 }}>{t('rolesPermissions.matrix.selected', { count: value.length })}</span>
          <Button size="small" onClick={() => toggleAll(true)}>{t('rolesPermissions.matrix.selectAll')}</Button>
          <Button size="small" onClick={() => toggleAll(false)}>{t('rolesPermissions.matrix.clearAll')}</Button>
        </Space>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(5, 1fr)', padding: '8px 14px', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{t('rolesPermissions.matrix.module')}</span>
        {ACTIONS.map((a) => (
          <span key={a} style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', textTransform: 'capitalize' }}>
            {t(`rolesPermissions.actionTypes.${a}`)}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {filteredModules.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', opacity: 0.5 }}>{t('rolesPermissions.matrix.noModules')}</div>
        )}
        {filteredModules.map((module, idx) => {
          const moduleLabel = moduleOptions.find((o) => o.value === module)?.label || module;
          const allChecked = isModuleAllChecked(module);
          const partial = isModulePartial(module);
          return (
            <div
              key={module}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px repeat(5, 1fr)',
                padding: '9px 14px',
                borderBottom: idx < filteredModules.length - 1 ? '1px solid var(--border-color)' : 'none',
                alignItems: 'center',
                background: idx % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox
                  checked={allChecked}
                  indeterminate={partial}
                  onChange={(e) => toggleModule(module, e.target.checked)}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{moduleLabel}</span>
              </div>
              {ACTIONS.map((action) => {
                const permId = grouped[module][action];
                return (
                  <div key={action} style={{ display: 'flex', justifyContent: 'center' }}>
                    {permId ? (
                      <Checkbox
                        checked={selectedSet.has(permId)}
                        onChange={() => toggle(permId)}
                      />
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: 16 }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RolesPermissionsPage() {
  const { t } = useTranslation();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [roleForm] = Form.useForm();
  const [permissionForm] = Form.useForm();

  // Pagination state for roles
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesPageSize, setRolesPageSize] = useState(10);

  // Pagination state for permissions
  const [permissionsPage, setPermissionsPage] = useState(1);
  const [permissionsPageSize, setPermissionsPageSize] = useState(10);

  const { data: rolesData, isLoading: rolesLoading } = useRoles({
    page: rolesPage,
    take: rolesPageSize,
  });
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions({
    page: permissionsPage,
    take: permissionsPageSize,
  });

  const roles = rolesData?.data || [];
  // Deduplicate permissions by name in case the DB has duplicates from multiple seeds
  const rawPermissions = permissionsData?.data || [];
  const permissions = rawPermissions.filter(
    (p, idx, self) => idx === self.findIndex((q) => q.name === p.name),
  );
  const rolesMeta = rolesData?.meta;
  const permissionsMeta = permissionsData?.meta;

  // Fetch all permissions for the matrix (non-paginated)
  const { data: allPermissionsRaw } = useAllPermissions();
  // Deduplicate by name in case the DB has duplicates from multiple seeds
  const allPermissions = (allPermissionsRaw || []).filter(
    (p, idx, self) => idx === self.findIndex((q) => q.name === p.name),
  );

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();

  const translatedModuleOptions = useMemo(() =>
    MODULE_OPTIONS.map((opt) => ({
      ...opt,
      label: t(`rolesPermissions.modules.${opt.value}`, opt.label),
    })), [t]
  );

  const translatedActionOptions = useMemo(() =>
    ACTION_OPTIONS.map((opt) => ({
      ...opt,
      label: t(`rolesPermissions.actionTypes.${opt.value}`, opt.label),
    })), [t]
  );

  // Role handlers
  const handleCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    const permissionIds = role.permissions?.map((p) => p.id) || [];
    roleForm.setFieldsValue({
      name: role.name,
      description: role.description,
      permission_ids: permissionIds,
    });
    setIsRoleModalOpen(true);
  };

  const handleRoleSubmit = async (values: {
    name: string;
    description: string;
    permission_ids: string[];
  }) => {
    const assignedPermissions = values.permission_ids || [];

    if (editingRole) {
      // For system roles, only update permissions (not name or description)
      if (editingRole.is_system) {
        await updateRole.mutateAsync({
          id: editingRole.id,
          permission_ids: assignedPermissions,
        });
      } else {
        // For non-system roles, update everything
        await updateRole.mutateAsync({
          id: editingRole.id,
          name: values.name,
          description: values.description,
          permission_ids: assignedPermissions,
        });
      }
    } else {
      await createRole.mutateAsync({
        name: values.name,
        description: values.description,
        permission_ids: assignedPermissions,
      });
    }
    setIsRoleModalOpen(false);
    roleForm.resetFields();
  };

  const handleDeleteRole = (role: Role) => {
    showConfirmDialog({
      title: t('rolesPermissions.roles.deleteTitle'),
      content: t('rolesPermissions.roles.deleteConfirm', { name: role.name }),
      onOk: async () => {
        await deleteRole.mutateAsync(role.id);
      },
      danger: true,
    });
  };

  // Permission handlers
  const handleCreatePermission = () => {
    setEditingPermission(null);
    permissionForm.resetFields();
    setIsPermissionModalOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    permissionForm.setFieldsValue({
      module: permission.module,
      action: [permission.action], // Wrap in array for multi-select
      name: permission.name,
      description: permission.description,
    });
    setIsPermissionModalOpen(true);
  };

  const handlePermissionSubmit = async (values: {
    module: string;
    action: string[];
    name: string;
    description: string;
  }) => {
    // Normalize module: lowercase, replace hyphens with underscores
    const moduleNormalized = values.module.toLowerCase().replace(/-/g, '_');

    if (editingPermission) {
      // When editing, only allow single action
      const nameNormalized = values.name.toLowerCase().replace(/-/g, '_');
      await updatePermission.mutateAsync({
        id: editingPermission.id,
        module: moduleNormalized,
        action: values.action[0] as PermissionAction,
        name: nameNormalized,
        description: values.description,
      });
    } else {
      // When creating, allow multiple actions - create one permission per action
      const actions = values.action;
      for (const action of actions) {
        const permissionName = `${moduleNormalized}:${action}`;
        await createPermission.mutateAsync({
          module: moduleNormalized,
          action: action as PermissionAction,
          name: permissionName,
          description: values.description || t('rolesPermissions.permissions.defaultDescription', { action, module: moduleNormalized }),
        });
      }
    }
    setIsPermissionModalOpen(false);
    permissionForm.resetFields();
  };

  const handleDeletePermission = (permission: Permission) => {
    showConfirmDialog({
      title: t('rolesPermissions.permissions.deleteTitle'),
      content: t('rolesPermissions.permissions.deleteConfirm', { name: permission.name }),
      onOk: async () => {
        await deletePermission.mutateAsync(permission.id);
      },
      danger: true,
    });
  };

  // Columns
  const roleColumns: ColumnsType<Role> = [
    { title: t('rolesPermissions.roles.colRoleName'), dataIndex: 'name', key: 'name' },
    { title: t('rolesPermissions.roles.colDescription'), dataIndex: 'description', key: 'description' },
    {
      title: t('rolesPermissions.roles.colSystemRole'),
      dataIndex: 'is_system',
      key: 'is_system',
      render: (val: boolean) => (val ? <Tag color="blue">{t('rolesPermissions.roles.system')}</Tag> : <Tag>{t('rolesPermissions.roles.custom')}</Tag>),
    },
    {
      title: t('rolesPermissions.roles.colPermissions'),
      key: 'permissions',
      render: (_: unknown, record: Role) => (
        <Space>
          <KeyOutlined />
          <Text type="secondary">{t('rolesPermissions.roles.permissionsCount', { count: record.permissions?.length || 0 })}</Text>
        </Space>
      ),
    },
    {
      title: t('rolesPermissions.roles.colCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
    {
      title: t('rolesPermissions.roles.colActions'),
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <Space size="small">
          <PermissionGuard permission="roles:update">
            <Tooltip title={t('rolesPermissions.actions.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditRole(record)}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="roles:delete">
            <Tooltip title={t('rolesPermissions.actions.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDeleteRole(record)}
                disabled={record.is_system}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const permissionColumns: ColumnsType<Permission> = [
    { title: t('rolesPermissions.permissions.colModule'), dataIndex: 'module', key: 'module' },
    { title: t('rolesPermissions.permissions.colAction'), dataIndex: 'action', key: 'action' },
    {
      title: t('rolesPermissions.permissions.colPermissionName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Tag color="green">{name}</Tag>,
    },
    { title: t('rolesPermissions.permissions.colDescription'), dataIndex: 'description', key: 'description' },
    {
      title: t('rolesPermissions.permissions.colCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
    {
      title: t('rolesPermissions.permissions.colActions'),
      key: 'actions',
      render: (_: unknown, record: Permission) => (
        <Space size="small">
          <PermissionGuard permission="permissions:update">
            <Tooltip title={t('rolesPermissions.actions.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditPermission(record)}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="permissions:delete">
            <Tooltip title={t('rolesPermissions.actions.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDeletePermission(record)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  // Tabs
  const items = [
    {
      key: 'roles',
      label: t('rolesPermissions.roles.tabTitle'),
      children: (
        <Card
          extra={
            <PermissionGuard permission="roles:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRole}>
                {t('rolesPermissions.roles.createRole')}
              </Button>
            </PermissionGuard>
          }
        >
          <Table
            columns={roleColumns}
            dataSource={roles}
            rowKey="id"
            loading={rolesLoading}
            pagination={{
              current: rolesPage,
              pageSize: rolesPageSize,
              total: rolesMeta?.itemCount || 0,
              showSizeChanger: true,
              showTotal: (total) => t('rolesPermissions.roles.totalCount', { count: total }),
              onChange: (page, pageSize) => {
                setRolesPage(page);
                setRolesPageSize(pageSize);
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'permissions',
      label: t('rolesPermissions.permissions.tabTitle'),
      children: (
        <Card
          extra={
            <PermissionGuard permission="permissions:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreatePermission}
              >
                {t('rolesPermissions.permissions.createPermission')}
              </Button>
            </PermissionGuard>
          }
        >
          <Table
            columns={permissionColumns}
            dataSource={permissions}
            rowKey="id"
            loading={permissionsLoading}
            pagination={{
              current: permissionsPage,
              pageSize: permissionsPageSize,
              total: permissionsMeta?.itemCount || 0,
              showSizeChanger: true,
              showTotal: (total) => t('rolesPermissions.permissions.totalCount', { count: total }),
              onChange: (page, pageSize) => {
                setPermissionsPage(page);
                setPermissionsPageSize(pageSize);
              },
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('settings.rolesPermissions')}
        subtitle={t('rolesPermissions.subtitle')}
      />

      <Tabs items={items} defaultActiveKey="roles" />

      {/* Role Modal */}
      <Modal
        title={editingRole ? t('rolesPermissions.roles.editRole') : t('rolesPermissions.roles.createRole')}
        open={isRoleModalOpen}
        onCancel={() => {
          setIsRoleModalOpen(false);
          roleForm.resetFields();
        }}
        onOk={() => roleForm.submit()}
        confirmLoading={createRole.isPending || updateRole.isPending}
        width={780}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleRoleSubmit}>
          {editingRole?.is_system && (
            <Text type="warning" style={{ display: 'block', marginBottom: 16 }}>
              {t('rolesPermissions.roles.systemRoleWarning')}
            </Text>
          )}
          <Form.Item
            name="name"
            label={t('rolesPermissions.roles.formRoleName')}
            rules={[{ required: true, message: t('rolesPermissions.roles.requiredRoleName') }]}
          >
            <Input
              placeholder={t('rolesPermissions.roles.placeholderRoleName')}
              disabled={editingRole?.is_system}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('rolesPermissions.roles.formDescription')}
            rules={[{ required: true, message: t('rolesPermissions.roles.requiredDescription') }]}
          >
            <TextArea
              rows={3}
              placeholder={t('rolesPermissions.roles.placeholderDescription')}
              disabled={editingRole?.is_system}
            />
          </Form.Item>

          <Form.Item name="permission_ids" label={t('rolesPermissions.roles.formPermissions')}>
            <PermissionsMatrix allPermissions={allPermissions} moduleOptions={translatedModuleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Modal */}
      <Modal
        title={editingPermission ? t('rolesPermissions.permissions.editPermission') : t('rolesPermissions.permissions.createPermission')}
        open={isPermissionModalOpen}
        onCancel={() => {
          setIsPermissionModalOpen(false);
          permissionForm.resetFields();
        }}
        onOk={() => permissionForm.submit()}
        confirmLoading={createPermission.isPending || updatePermission.isPending}
      >
        <Form form={permissionForm} layout="vertical" onFinish={handlePermissionSubmit}>
          <Form.Item
            name="module"
            label={t('rolesPermissions.permissions.formModule')}
            rules={[{ required: true, message: t('rolesPermissions.permissions.requiredModule') }]}
          >
            <Select
              placeholder={t('rolesPermissions.permissions.placeholderModule')}
              showSearch
              optionFilterProp="label"
              options={translatedModuleOptions}
            />
          </Form.Item>

          <Form.Item
            name="action"
            label={t('rolesPermissions.permissions.formAction')}
            rules={[{ required: true, message: t('rolesPermissions.permissions.requiredAction') }]}
          >
            <Select
              mode={editingPermission ? undefined : 'multiple'}
              placeholder={
                editingPermission
                  ? t('rolesPermissions.permissions.placeholderActionSingle')
                  : t('rolesPermissions.permissions.placeholderActionMultiple')
              }
              options={translatedActionOptions}
              maxTagCount="responsive"
            />
          </Form.Item>

          {editingPermission && (
            <Form.Item
              name="name"
              label={t('rolesPermissions.permissions.formPermissionName')}
              rules={[{ required: true, message: t('rolesPermissions.permissions.requiredPermissionName') }]}
            >
              <Input placeholder={t('rolesPermissions.permissions.placeholderPermissionName')} />
            </Form.Item>
          )}

          {!editingPermission && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('rolesPermissions.permissions.autoGenerateWarning')}
            </Text>
          )}

          <Form.Item
            name="description"
            label={t('rolesPermissions.permissions.formDescription')}
            rules={[{ required: true, message: t('rolesPermissions.permissions.requiredDescription') }]}
          >
            <TextArea rows={3} placeholder={t('rolesPermissions.permissions.placeholderDescription')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}