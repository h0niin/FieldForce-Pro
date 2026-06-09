import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Table,
  Select,
  Button,
  Space,
  Tag,
  Input,
  Breadcrumb,
  Card,
  Spin,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  SearchOutlined,
  SaveOutlined,
  LockOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useFieldPermissions, useSaveFieldPermissions } from '@/hooks/use-field-permissions';
import { useUiStore } from '@/store/ui.store';

const { Title, Text } = Typography;

export default function FieldPermissionsPage() {
  const { moduleName } = useParams<{ moduleName: string }>();
  const navigate = useNavigate();
  const decodedModuleName = decodeURIComponent(moduleName || '');

  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  const { data, isLoading } = useFieldPermissions(decodedModuleName);
  const savePermissions = useSaveFieldPermissions();

  const [search, setSearch] = useState('');
  const [modified, setModified] = useState<Record<string, Record<string, 'none' | 'read' | 'read_write'>>>({});

  // Reset modifications when data changes
  useEffect(() => {
    setModified({});
  }, [data]);

  if (isLoading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Spin size="large" tip="Loading field permissions..." />
      </div>
    );
  }

  const { roles, fields } = data;

  const handleCellChange = (fieldName: string, roleId: string, value: 'none' | 'read' | 'read_write') => {
    setModified((prev) => ({
      ...prev,
      [fieldName]: {
        ...(prev[fieldName] || {}),
        [roleId]: value,
      },
    }));
  };

  const hasChanges = Object.keys(modified).length > 0;

  const handleSave = async () => {
    const payload: { field_name: string; role_id: string; access_level: string }[] = [];
    Object.entries(modified).forEach(([fieldName, rolePermissions]) => {
      Object.entries(rolePermissions).forEach(([roleId, accessLevel]) => {
        payload.push({
          field_name: fieldName,
          role_id: roleId,
          access_level: accessLevel,
        });
      });
    });

    if (payload.length > 0) {
      await savePermissions.mutateAsync({
        moduleName: decodedModuleName,
        permissions: payload,
      });
      setModified({});
    }
  };

  const filteredFields = fields.filter((f) =>
    f.field_name.toLowerCase().includes(search.toLowerCase()) ||
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Field Details',
      key: 'field',
      width: 250,
      render: (_: any, record: any) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ fontSize: 13, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>{record.label}</Text>
            {record.is_custom ? (
              <Tag color="geekblue" style={{ fontSize: 10 }}>Custom</Tag>
            ) : (
              <Tag style={{ fontSize: 10 }}>Standard</Tag>
            )}
          </div>
          <Text code style={{ fontSize: 11, color: isDark ? '#a3a3a3' : '#8c8c8c' }}>{record.field_name}</Text>
        </div>
      ),
    },
    ...roles.map((role) => ({
      title: (
        <Tooltip title={`Configure permissions for ${role.name}`}>
          <span>{role.name}</span>
        </Tooltip>
      ),
      key: role.id,
      width: 180,
      render: (_: any, record: any) => {
        const currentVal = modified[record.field_name]?.[role.id] ?? record.permissions[role.id] ?? 'read_write';
        return (
          <Select
            value={currentVal}
            onChange={(val) => handleCellChange(record.field_name, role.id, val)}
            style={{ width: '100%' }}
            dropdownStyle={{ minWidth: 140 }}
            options={[
              {
                value: 'read_write',
                label: (
                  <span style={{ color: '#2f54eb' }}>
                    <EditOutlined style={{ marginRight: 6 }} />
                    Read-Write
                  </span>
                ),
              },
              {
                value: 'read',
                label: (
                  <span style={{ color: '#fa8c16' }}>
                    <EyeOutlined style={{ marginRight: 6 }} />
                    Read-Only
                  </span>
                ),
              },
              {
                value: 'none',
                label: (
                  <span style={{ color: '#f5222d' }}>
                    <LockOutlined style={{ marginRight: 6 }} />
                    No Access
                  </span>
                ),
              },
            ]}
          />
        );
      },
    })),
  ];

  return (
    <div>
      {/* Navigation Breadcrumbs */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <a onClick={() => navigate('/settings/customization/modules')}>Modules &amp; Fields</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{decodedModuleName}</Breadcrumb.Item>
        <Breadcrumb.Item>Field Permissions</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header section */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }} bodyStyle={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/settings/customization/modules')}
              style={{ fontSize: 16 }}
            />
            <div>
              <Title level={4} style={{ margin: 0, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
                Field Permissions — {decodedModuleName}
              </Title>
              <Text style={{ color: isDark ? '#a3a3a3' : '#8c8c8c', fontSize: 13 }}>
                Configure role-based access levels (Read-Write, Read-Only, No Access) for each field in this module.
              </Text>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              {hasChanges && (
                <Tag color="warning" style={{ padding: '4px 8px', fontSize: 12 }}>
                  Unsaved changes
                </Tag>
              )}
              <Button
                type="primary"
                icon={<SaveOutlined />}
                disabled={!hasChanges}
                loading={savePermissions.isPending}
                onClick={handleSave}
              >
                Save Permissions
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Filter and Matrix Table */}
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}` }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search fields by name or label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 360, borderRadius: 8 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredFields}
          rowKey="field_name"
          pagination={false}
          scroll={{ x: 'max-content' }}
          style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
        />
      </Card>
    </div>
  );
}
