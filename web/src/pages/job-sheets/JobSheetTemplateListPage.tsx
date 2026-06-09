import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag, Modal, Form, Input, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useJobSheetTemplates, useDeleteJobSheetTemplate, useCreateJobSheetTemplate } from '@/hooks/use-job-sheets';
import type { JobSheetTemplate } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';

export default function JobSheetTemplateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useJobSheetTemplates({ page, take: pageSize, search });
  const deleteTemplate = useDeleteJobSheetTemplate();
  const createTemplate = useCreateJobSheetTemplate();

  const templates = data?.data || [];
  const meta = data?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (template: JobSheetTemplate) => {
    showConfirmDialog({
      title: t('jobSheetTemplates.deleteDialogTitle', 'Delete Job Sheet'),
      content: t('jobSheetTemplates.deleteDialogContent', `Are you sure you want to delete ${template.name}?`),
      onOk: async () => {
        await deleteTemplate.mutateAsync(template.id);
      },
      danger: true,
    });
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const response = await createTemplate.mutateAsync({
        name: values.name,
        description: values.description,
      });
      setIsModalVisible(false);
      form.resetFields();
      // Redirect to builder page
      if (response?.data?.data?.id) {
        navigate(`/settings/customization/job-sheets/${response.data.data.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create job sheet', error);
    }
  };

  const columns: ColumnsType<JobSheetTemplate> = [
    {
      title: t('jobSheetTemplates.columns.name', 'Name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500, color: 'var(--primary-color)' }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('jobSheetTemplates.columns.description', 'Description'),
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => <span style={{ opacity: description ? 1 : 0.5 }}>{description || '-'}</span>,
    },
    {
      title: t('jobSheetTemplates.columns.services', 'Services'),
      key: 'services',
      render: () => <span style={{ opacity: 0.5 }}>-</span>, // To be implemented with services API
    },
    {
      title: t('jobSheetTemplates.columns.lastModified', 'Last Modified'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: t('jobSheetTemplates.columns.status', 'Status - All'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) =>
        active ? <Tag color="green">{t('jobSheetTemplates.status.active', 'Active')}</Tag> : <Tag color="red">{t('jobSheetTemplates.status.inactive', 'Inactive')}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="job-sheets:update">
            <Tooltip title={t('common.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/settings/customization/job-sheets/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="job-sheets:delete">
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('jobSheetTemplates.title', 'Job Sheets')}
        subtitle={t('jobSheetTemplates.subtitle', 'The Job Sheet is a customisable form linked to services and completed by field agents on site. It captures essential details such as task checklists, work logs and readings, along with Before-and-After photos.')}
        extra={
          <PermissionGuard permission="job-sheets:create">
            <Button type="primary" style={{ backgroundColor: '#2e8b57', borderColor: '#2e8b57' }} onClick={() => setIsModalVisible(true)}>
              {t('jobSheetTemplates.createButton', 'Create Job Sheet')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SearchFilter
          placeholder={t('jobSheetTemplates.searchPlaceholder', 'Search')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('jobSheetTemplates.paginationTotal', `Total ${total} records`),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
        locale={{ emptyText: t('jobSheetTemplates.emptyText', 'No Records Found') }}
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', color: '#2e8b57' }}>📋</span>
            <span>{t('jobSheetTemplates.modalTitle', 'Create New Jobsheet')}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            style={{ backgroundColor: '#2e8b57', borderColor: '#2e8b57' }}
            onClick={handleCreate}
            loading={createTemplate.isPending}
          >
            {t('common.create', 'Create')}
          </Button>,
        ]}
        width={500}
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} style={{ marginTop: '24px' }}>
          <Form.Item
            name="name"
            label={t('jobSheetTemplates.form.name', 'Name')}
            rules={[{ required: true, message: t('jobSheetTemplates.form.nameRequired', 'Please input the jobsheet name!') }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label={t('jobSheetTemplates.form.description', 'Description')}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="services"
            label={t('jobSheetTemplates.form.services', 'Services')}
          >
            <Select placeholder={t('jobSheetTemplates.form.servicesPlaceholder', 'Select')}>
              {/* Add options here when integrated with services endpoint */}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}