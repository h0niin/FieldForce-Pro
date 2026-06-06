import { useState } from 'react';
import { Card, Table, Typography, Space, Tag, Button, Popconfirm, Modal, Form, Input, InputNumber } from 'antd';
import { DeleteOutlined, SyncOutlined, PlusOutlined, CopyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { 
  useSuperAdminApiKeys, 
  useCreateSuperAdminApiKey, 
  useRevokeSuperAdminApiKey,
  useRegenerateSuperAdminApiKey
} from '@/hooks/use-super-admin-api-keys';
import { formatDateTime } from '@/utils/format-date';
import { SuperAdminApiKey } from '@/api/super-admin-api-keys.api';

const { Text, Paragraph } = Typography;

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const { data: keys, isLoading } = useSuperAdminApiKeys();
  const createMutation = useCreateSuperAdminApiKey();
  const revokeMutation = useRevokeSuperAdminApiKey();
  const regenerateMutation = useRegenerateSuperAdminApiKey();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async (values: any) => {
    try {
      const res = await createMutation.mutateAsync(values);
      if (res.api_key) {
        setGeneratedKey(res.api_key);
      }
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setGeneratedKey(null);
    form.resetFields();
  };

  const columns: ColumnsType<SuperAdminApiKey> = [
    {
      title: t('apiKeys.keyName'),
      dataIndex: 'key_name',
      key: 'key_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: t('apiKeys.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? t('apiKeys.active') : t('apiKeys.revoked')}
        </Tag>
      ),
    },
    {
      title: t('apiKeys.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('apiKeys.lastUsed'),
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      render: (date?: string) => date ? formatDateTime(date) : <Text type="secondary">{t('apiKeys.never')}</Text>,
    },
    {
      title: t('apiKeys.expiresAt'),
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (date?: string) => date ? formatDateTime(date) : <Text type="secondary">{t('apiKeys.never')}</Text>,
    },
    {
      title: t('apiKeys.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.is_active && (
            <>
              <Popconfirm
                title={t('apiKeys.regenerateKey')}
                description={t('apiKeys.regenerateConfirmation')}
                onConfirm={async () => {
                  const res = await regenerateMutation.mutateAsync({ id: record.id, key_name: record.key_name });
                  if (res.api_key) {
                    setGeneratedKey(res.api_key);
                    setIsModalVisible(true);
                  }
                }}
              >
                <Button type="text" icon={<SyncOutlined />} />
              </Popconfirm>
              <Popconfirm
                title={t('apiKeys.revokeKey')}
                description={t('apiKeys.revokeConfirmation')}
                onConfirm={() => revokeMutation.mutate(record.id)}
                okButtonProps={{ danger: true }}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('apiKeys.title')}
        subtitle={t('apiKeys.subtitle')}
        extra={[
          <Button 
            key="create" 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            {t('apiKeys.generateNewKey')}
          </Button>
        ]}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={keys || []}
          rowKey="id"
          loading={isLoading}
        />
      </Card>

      <Modal
        title={generatedKey ? t('apiKeys.apiKeyGenerated') : t('apiKeys.generateApiKey')}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={generatedKey ? [
          <Button key="close" type="primary" onClick={handleModalClose}>
            {t('apiKeys.done')}
          </Button>
        ] : undefined}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        {generatedKey ? (
          <div>
            <Paragraph type="warning" strong>
              {t('apiKeys.copyWarning')}
            </Paragraph>
            <div style={{ padding: '16px', background: 'rgba(128, 128, 128, 0.1)', borderRadius: '4px', marginBottom: '16px' }}>
              <Text copyable style={{ fontSize: '16px', fontFamily: 'monospace' }}>{generatedKey}</Text>
            </div>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item 
              name="key_name" 
              label={t('apiKeys.keyName')} 
              rules={[{ required: true, message: t('apiKeys.keyNameRequired') }]}
            >
              <Input placeholder={t('apiKeys.keyNamePlaceholder')} />
            </Form.Item>
            <Form.Item 
              name="expires_in_days" 
              label={t('apiKeys.expiresInDays')}
            >
              <InputNumber placeholder={t('apiKeys.expiresInDaysPlaceholder')} min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}