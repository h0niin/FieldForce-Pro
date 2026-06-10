import { useState, useEffect } from 'react';
import { Button, Table, Space, Tooltip, Modal, Form, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';
import { useTerritories, useDeleteTerritory, useCreateTerritory } from '@/hooks/use-territories';
import type { Territory } from '@/types/models.types';

export default function TerritoriesList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data: territoriesData, isLoading } = useTerritories({
    page,
    take: pageSize,
    search,
  });

  const deleteTerritory = useDeleteTerritory();
  const createTerritory = useCreateTerritory();

  const rawData = Array.isArray(territoriesData) ? territoriesData : territoriesData?.data;
  const territories = Array.isArray(rawData) ? rawData : [];
  const meta = territoriesData?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (territory: Territory) => {
    showConfirmDialog({
      title: 'Delete Territory',
      content: `Are you sure you want to delete ${territory.name}?`,
      onOk: async () => {
        await deleteTerritory.mutateAsync(territory.id);
      },
      danger: true,
    });
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createTerritory.mutateAsync(values);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to create territory', error);
    }
  };

  const columns: ColumnsType<Territory> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#5B8FF9' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) => desc || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="settings:update">
            <Tooltip title={t('common.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Territories"
        subtitle="Manage scheduling territories"
        extra={
          <PermissionGuard permission="settings:update">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Create Territory
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder="Search territories..."
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={territories}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} territories`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <Modal
        title="Create Territory"
        open={isModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={createTerritory.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Territory Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., North Region" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Optional description" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
