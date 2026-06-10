import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, CompassOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { useUsers } from '@/hooks/use-users';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';

interface TerritoryItem {
  id: string;
  name: string;
  description: string;
  zip_codes: string[];
  dispatcher_ids: string[];
  technician_ids: string[];
  coordinates?: [number, number][];
  color?: string;
}

export default function TerritoriesSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch setting key
  const { data: settingData, isLoading } = useSetting('territories_settings');
  const upsertMutation = useUpsertSetting();

  // Fetch users for dropdown assignment
  const { data: usersData } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  const [territories, setTerritories] = useState<TerritoryItem[]>([]);

  useEffect(() => {
    if (settingData?.value?.list) {
      setTerritories(settingData.value.list as TerritoryItem[]);
    }
  }, [settingData]);

  const saveTerritories = async (newList: TerritoryItem[]) => {
    await upsertMutation.mutateAsync({
      key: 'territories_settings',
      category: 'workforce',
      value: { list: newList },
    });
    setTerritories(newList);
  };

  const handleDelete = (record: TerritoryItem) => {
    showConfirmDialog({
      title: t('settings.territories.deleteTitle', 'Delete Territory'),
      content: t('settings.territories.deleteConfirm', {
        name: record.name,
      }),
      onOk: async () => {
        const newList = territories.filter((item) => item.id !== record.id);
        await saveTerritories(newList);
      },
      danger: true,
    });
  };

  const getUserNames = (ids: string[]) => {
    return ids
      .map((id) => {
        const u = users.find((user) => user.id === id);
        return u ? `${u.first_name} ${u.last_name}` : null;
      })
      .filter(Boolean) as string[];
  };

  const columns: ColumnsType<TerritoryItem> = [
    {
      title: t('settings.territories.colName', 'Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
          <span style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: record.color || '#3B82F6',
            marginRight: 8
          }}></span>
          <CompassOutlined style={{ marginRight: 6 }} /> {name}
        </span>
      ),
    },
    {
      title: t('settings.territories.colDesc', 'Description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('settings.territories.colBoundary', 'Map Boundary'),
      key: 'boundary',
      render: (_, record) => {
        const pointsCount = record.coordinates?.length || 0;
        return pointsCount >= 3 ? (
          <Tag color="cyan">{pointsCount} Points (Polygon)</Tag>
        ) : pointsCount > 0 ? (
          <Tag color="orange">{pointsCount} Points (Incomplete)</Tag>
        ) : (
          <Tag color="default">No Boundary Map</Tag>
        );
      }
    },
    {
      title: t('settings.territories.colZips', 'Zip Codes'),
      dataIndex: 'zip_codes',
      key: 'zip_codes',
      render: (zips: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {zips.slice(0, 4).map((zip) => (
            <Tag key={zip}>{zip}</Tag>
          ))}
          {zips.length > 4 && <Tag>+{zips.length - 4} more</Tag>}
          {zips.length === 0 && <span style={{ opacity: 0.5 }}>-</span>}
        </div>
      ),
    },
    {
      title: t('settings.territories.colDispatchers', 'Assigned Dispatchers'),
      dataIndex: 'dispatcher_ids',
      key: 'dispatcher_ids',
      render: (ids: string[]) => {
        const names = getUserNames(ids);
        return names.length > 0 ? (
          names.map((name) => <Tag color="geekblue" key={name}>{name}</Tag>)
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        );
      },
    },
    {
      title: t('settings.territories.colTechnicians', 'Assigned Technicians'),
      dataIndex: 'technician_ids',
      key: 'technician_ids',
      render: (ids: string[]) => {
        const names = getUserNames(ids);
        return names.length > 0 ? (
          names.map((name) => <Tag color="green" key={name}>{name}</Tag>)
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        );
      },
    },
    {
      title: t('settings.territories.colActions', 'Actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/settings/territories/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title={t('common.delete', 'Delete')}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {t('settings.territories.title', 'Territories')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 650 }}>
            Define geographic service boundaries to organize dispatch logic. Assign field technicians and routing dispatchers to specific territories to ensure that service requests are always routed to the correct local crew.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/settings/territories/new')}
        >
          {t('settings.territories.addBtn', 'Create Territory')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={territories}
        rowKey="id"
        loading={isLoading}
        pagination={false}
      />
    </div>
  );
}
