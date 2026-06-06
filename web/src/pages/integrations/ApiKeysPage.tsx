import { useState } from 'react';
import {
  Button,
  Table,
  Space,
  Tag,
  Tooltip,
  Modal,
  Form,
  Input,
  Alert,
  Typography,
  DatePicker,
  Checkbox,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  StopOutlined,
  CopyOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useApiKeys, useCreateApiKey, useRevokeApiKey, useDeleteApiKey } from '@/hooks/use-api-keys';
import type { ApiKey, CreateApiKeyPayload } from '@/api/api-keys.api';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDateTime } from '@/utils/format-date';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const AVAILABLE_SCOPES = [
  'service_requests:read',
  'service_requests:write',
  'work_orders:read',
  'work_orders:write',
  'contacts:read',
  'contacts:write',
  'invoices:read',
  'invoices:write',
];

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useApiKeys({ page, take: pageSize });
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const deleteApiKey = useDeleteApiKey();

  const keys = (data?.data || []) as ApiKey[];
  const meta = data?.meta;

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateApiKeyPayload = {
        name: values.name,
        scopes: values.scopes ?? [],
        expires_at: values.expires_at ? values.expires_at.toISOString() : undefined,
      };
      const response = await createApiKey.mutateAsync(payload);
      const rawKey = (response.data.data as any)?.raw_key;
      setCreatedKey(rawKey ?? null);
      form.resetFields();
      setCreateOpen(false);
    } catch {
      // validation errors handled by form
    }
  };

  const handleRevoke = (record: ApiKey) => {
    showConfirmDialog({
      title: t('apiKeys.revokeTitle'),
      content: t('apiKeys.revokeContent', { name: record.name }),
      onOk: async () => {
        await revokeApiKey.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const handleDelete = (record: ApiKey) => {
    showConfirmDialog({
      title: t('apiKeys.deleteTitle'),
      content: t('apiKeys.deleteContent', { name: record.name }),
      onOk: async () => {
        await deleteApiKey.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const columns: ColumnsType<ApiKey> = [
    {
      title: t('apiKeys.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: t('apiKeys.columns.keyPrefix'),
      dataIndex: 'key_prefix',
      key: 'key_prefix',
      render: (prefix: string) => (
        <code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
          {prefix}…
        </code>
      ),
    },
    {
      title: t('apiKeys.columns.scopes'),
      dataIndex: 'scopes',
      key: 'scopes',
      render: (scopes: string[]) => (
        <Space size="small" wrap>
          {scopes?.length
            ? scopes.slice(0, 3).map((s) => <Tag key={s} color="blue">{s}</Tag>)
            : <Tag color="default">{t('apiKeys.noScopes')}</Tag>}
          {scopes?.length > 3 && <Tag>+{scopes.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: t('apiKeys.columns.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) =>
        isActive
          ? <Tag color="green">{t('apiKeys.status.active')}</Tag>
          : <Tag color="red">{t('apiKeys.status.revoked')}</Tag>,
    },
    {
      title: t('apiKeys.columns.lastUsed'),
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      render: (date: string | null) =>
        date ? formatDateTime(date) : <Text type="secondary">{t('apiKeys.never')}</Text>,
    },
    {
      title: t('apiKeys.columns.expires'),
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (date: string | null) =>
        date ? formatDateTime(date) : <Text type="secondary">{t('apiKeys.never')}</Text>,
    },
    {
      title: t('apiKeys.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {record.is_active && (
            <Tooltip title={t('apiKeys.actions.revoke')}>
              <Button
                type="text"
                icon={<StopOutlined />}
                size="small"
                onClick={() => handleRevoke(record)}
              />
            </Tooltip>
          )}
          <Tooltip title={t('apiKeys.actions.delete')}>
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
      <PageHeader
        title={t('apiKeys.title')}
        subtitle={t('apiKeys.subtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('apiKeys.createButton')}
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={keys}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('apiKeys.tableTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setPage(1);
            }
          },
        }}
      />

      <Modal
        title={<Space><KeyOutlined /> {t('apiKeys.modal.createTitle')}</Space>}
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        confirmLoading={createApiKey.isPending}
        okText={t('apiKeys.modal.create')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label={t('apiKeys.form.nameLabel')}
            rules={[{ required: true, message: t('apiKeys.form.nameRequired') }]}
          >
            <Input placeholder={t('apiKeys.form.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="scopes" label={t('apiKeys.form.scopesLabel')}>
            <Checkbox.Group options={AVAILABLE_SCOPES} style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
          </Form.Item>
          <Form.Item name="expires_at" label={t('apiKeys.form.expiryLabel')}>
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => d && d < dayjs().startOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('apiKeys.revealModal.title')}
        open={!!createdKey}
        onOk={() => setCreatedKey(null)}
        onCancel={() => setCreatedKey(null)}
        okText={t('apiKeys.revealModal.savedButton')}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Alert
          type="warning"
          message={t('apiKeys.revealModal.warning')}
          style={{ marginBottom: 16 }}
        />
        <div
          style={{
            background: '#f5f5f5',
            borderRadius: 6,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Paragraph
            code
            copyable={false}
            style={{ margin: 0, wordBreak: 'break-all', flex: 1 }}
          >
            {createdKey}
          </Paragraph>
          <Tooltip title={t('apiKeys.revealModal.copy')}>
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => copyToClipboard(createdKey!)}
            />
          </Tooltip>
        </div>
      </Modal>
    </div>
  );
}