import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Descriptions,
  Table,
  Tag,
  Space,
  Spin,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  CameraOutlined,
  EditOutlined,
  NumberOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { useJobSheetInstance, useJobSheetItems } from '@/hooks/use-job-sheets';
import { formatDateTime } from '@/utils/format-date';
import type { JobSheetItem } from '@/types/models.types';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  draft: 'default',
  pending: 'blue',
  approved: 'cyan',
  in_progress: 'orange',
  completed: 'green',
};

const typeIcons: Record<string, React.ReactNode> = {
  checkbox: <CheckSquareOutlined />,
  text: <FileTextOutlined />,
  photo: <CameraOutlined />,
  signature: <EditOutlined />,
  number: <NumberOutlined />,
  date: <CalendarOutlined />,
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function JobSheetDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: instance, isLoading: instanceLoading } = useJobSheetInstance(id || '');
  const { data: items, isLoading: itemsLoading } = useJobSheetItems(id || '');

  if (instanceLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!instance) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">{t('jobSheetDetail.notFound')}</Text>
      </div>
    );
  }

  const notes = (instance.custom_fields as Record<string, unknown>)?.notes as string | undefined;

  const columns: ColumnsType<JobSheetItem> = [
    {
      title: t('jobSheetDetail.columns.position'),
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      render: (val: number) => val + 1,
      defaultSortOrder: 'ascend' as const,
      sorter: (a: JobSheetItem, b: JobSheetItem) => a.sort_order - b.sort_order,
    },
    {
      title: t('jobSheetDetail.columns.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag icon={typeIcons[type]}>{type}</Tag>
      ),
    },
    {
      title: t('jobSheetDetail.columns.label'),
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: t('jobSheetDetail.columns.value'),
      dataIndex: 'value',
      key: 'value',
      render: (val: string | null) =>
        val ? <Text>{val}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: t('jobSheetDetail.columns.required'),
      dataIndex: 'is_required',
      key: 'is_required',
      width: 100,
      render: (req: boolean) =>
        req ? <Tag color="red">{t('jobSheetDetail.required')}</Tag> : <Tag>{t('jobSheetDetail.optional')}</Tag>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('jobSheetDetail.title')}
        subtitle={`${t('jobSheetDetail.id')}: ${instance.id.slice(0, 8)}...`}
        extra={
          <Space>
            <Tag color={statusColors[instance.status] || 'default'} style={{ fontSize: 14, padding: '2px 10px' }}>
              {formatStatus(instance.status)}
            </Tag>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/job-sheets')}>
              {t('jobSheetDetail.back')}
            </Button>
          </Space>
        }
      />

      <Card title={t('jobSheetDetail.details')} style={{ marginBottom: 24 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label={t('jobSheetDetail.fields.template')}>
            {instance.template?.name || (instance.template_id ? instance.template_id.slice(0, 8) + '...' : t('jobSheetDetail.na'))}
          </Descriptions.Item>
          <Descriptions.Item label={t('jobSheetDetail.fields.status')}>
            <Tag color={statusColors[instance.status] || 'default'}>
              {formatStatus(instance.status)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('jobSheetDetail.fields.workOrder')}>
            {instance.work_order_id ? (
              <Link to={`/work-orders/${instance.work_order_id}`}>
                {instance.work_order_id.slice(0, 8)}...
              </Link>
            ) : (
              <Text type="secondary">-</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('jobSheetDetail.fields.appointment')}>
            {instance.appointment_id ? (
              <Text>{instance.appointment_id.slice(0, 8)}...</Text>
            ) : (
              <Text type="secondary">-</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('jobSheetDetail.fields.created')}>
            {formatDateTime(instance.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('jobSheetDetail.fields.updated')}>
            {formatDateTime(instance.updated_at)}
          </Descriptions.Item>
          {instance.completed_at && (
            <Descriptions.Item label={t('jobSheetDetail.fields.completed')}>
              {formatDateTime(instance.completed_at)}
            </Descriptions.Item>
          )}
          {notes && (
            <Descriptions.Item label={t('jobSheetDetail.fields.notes')} span={2}>
              {notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={t('jobSheetDetail.items')}>
        <Table
          columns={columns}
          dataSource={items || []}
          rowKey="id"
          loading={itemsLoading}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}