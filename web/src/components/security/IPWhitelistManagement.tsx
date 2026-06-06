import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Tag,
  Typography,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/utils/format-date';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import type { IPWhitelistEntry } from '@/api/ip-whitelist.api';
import {
  useIPWhitelist,
  useIPWhitelistConfig,
  useMyIP,
  useCreateIPWhitelist,
  useUpdateIPWhitelist,
  useDeleteIPWhitelist,
  useToggleIPWhitelist,
} from '@/hooks/use-ip-whitelist';

const { TextArea } = Input;
const { Text } = Typography;

export default function IPWhitelistManagement() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IPWhitelistEntry | null>(null);
  const [form] = Form.useForm();

  const { data: ipEntries = [], isLoading: isLoadingEntries } = useIPWhitelist();
  const { data: config, isLoading: isLoadingConfig } = useIPWhitelistConfig();
  const createMutation = useCreateIPWhitelist();
  const updateMutation = useUpdateIPWhitelist();
  const deleteMutation = useDeleteIPWhitelist();
  const toggleMutation = useToggleIPWhitelist();
  const { data: myIP } = useMyIP();

  const whitelistEnabled = config?.enabled ?? false;

  const handleCreate = () => {
    setEditingEntry(null);
    form.resetFields();
    if (myIP) {
      form.setFieldsValue({ ip_address: myIP });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (entry: IPWhitelistEntry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      ip_address: entry.ip_address,
      description: entry.description,
      is_active: entry.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (entry: IPWhitelistEntry) => {
    showConfirmDialog({
      title: t('ipWhitelist.removeTitle'),
      content: t('ipWhitelist.removeConfirm', { ip: entry.ip_address }),
      onOk: async () => {
        await deleteMutation.mutateAsync(entry.id).catch(() => {});
      },
      danger: true,
    });
  };

  const handleSubmit = async (values: { ip_address: string; description?: string; is_active?: boolean }) => {
    try {
      if (editingEntry) {
        await updateMutation.mutateAsync({ id: editingEntry.id, ...values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setIsModalOpen(false);
      form.resetFields();
    } catch {
      // error toast handled by hook onError
    }
  };

  const handleToggle = (enabled: boolean) => {
    toggleMutation.mutate(enabled);
  };

  const validateIP = (_: unknown, value: string) => {
    if (!value) {
      return Promise.reject(new Error(t('ipWhitelist.errorRequired')));
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(value)) {
      return Promise.reject(new Error(t('ipWhitelist.errorInvalidFormat')));
    }

    const [ip] = value.split('/');
    const octets = ip.split('.');
    const validOctets = octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });

    if (!validOctets) {
      return Promise.reject(new Error(t('ipWhitelist.errorInvalidIP')));
    }

    return Promise.resolve();
  };

  const columns: ColumnsType<IPWhitelistEntry> = [
    {
      title: t('ipWhitelist.tableIpAddress'),
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => (
        <Space>
          <GlobalOutlined />
          <Text code strong>
            {ip}
          </Text>
        </Space>
      ),
    },
    {
      title: t('ipWhitelist.tableDescription'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('ipWhitelist.tableStatus'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'} icon={active ? <CheckCircleOutlined /> : undefined}>
          {active ? t('ipWhitelist.statusActive') : t('ipWhitelist.statusInactive')}
        </Tag>
      ),
    },
    {
      title: t('ipWhitelist.tableAdded'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('ipWhitelist.tableActions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>{t('ipWhitelist.enableLabel')}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('ipWhitelist.enableDescription')}
              </Text>
            </div>
          </div>
          <Switch
            checked={whitelistEnabled}
            onChange={handleToggle}
            loading={isLoadingConfig || toggleMutation.isPending}
            checkedChildren={t('ipWhitelist.statusEnabled')}
            unCheckedChildren={t('ipWhitelist.statusDisabled')}
          />
        </div>

        {whitelistEnabled && (
          <Alert
            message={t('ipWhitelist.alertActiveTitle')}
            description={t('ipWhitelist.alertActiveDescription')}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <Card
        title={t('ipWhitelist.tableTitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('ipWhitelist.addButton')}
          </Button>
        }
      >
        <Alert
          message={
            <Space>
              <InfoCircleOutlined />
              <span>{t('ipWhitelist.cidrInfo')}</span>
            </Space>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={ipEntries}
          rowKey="id"
          loading={isLoadingEntries}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingEntry ? t('ipWhitelist.modalEditTitle') : t('ipWhitelist.modalAddTitle')}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="ip_address"
            label={t('ipWhitelist.formIpAddress')}
            rules={[
              { required: true },
              { validator: validateIP },
            ]}
          >
            <Input
              placeholder={t('ipWhitelist.placeholderIp')}
              prefix={<GlobalOutlined />}
            />
          </Form.Item>

          <Alert
            message={t('ipWhitelist.cidrExamplesTitle')}
            description={
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>{t('ipWhitelist.cidrSingle')}</li>
                <li>{t('ipWhitelist.cidrClassC')}</li>
                <li>{t('ipWhitelist.cidrClassB')}</li>
              </ul>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="description" label={t('ipWhitelist.formDescription')}>
            <TextArea
              rows={3}
              placeholder={t('ipWhitelist.placeholderDescription')}
            />
          </Form.Item>

          <Form.Item name="is_active" label={t('ipWhitelist.formActive')} valuePropName="checked" initialValue={true}>
            <Switch checkedChildren={t('ipWhitelist.statusActive')} unCheckedChildren={t('ipWhitelist.statusInactive')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}