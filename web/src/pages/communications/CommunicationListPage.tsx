import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCommunications } from '@/hooks/use-communications';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';

interface CommunicationRecord {
  id: string;
  contact_id: string;
  contact?: { first_name: string; last_name: string };
  type: string;
  channel: string;
  subject: string;
  body: string;
  sent_at: string;
  status: string;
  created_at: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  email: 'blue',
  sms: 'green',
  whatsapp: 'cyan',
  push: 'purple',
  in_app: 'orange',
};

export default function CommunicationListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useCommunications({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });

  const communications = ((data?.data || []) as CommunicationRecord[]).filter((comm) => {
    if (channelFilter && comm.channel !== channelFilter) return false;
    return true;
  });
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns: ColumnsType<CommunicationRecord> = [
    {
      title: t('communications.columns.contact'),
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('communications.columns.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string, record: any) => (<Link to={`/communications/${record.id}`}><Tag>{type}</Tag></Link>),
    },
    {
      title: t('communications.columns.channel'),
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string, record: any) => (
        <Tag color={CHANNEL_COLORS[channel] || 'default'}>
          {channel ? channel.charAt(0).toUpperCase() + channel.slice(1) : '-'}
        </Tag>
      ),
    },
    {
      title: t('communications.columns.subject'),
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string, record: any) => <span style={{ fontWeight: 500 }}>{subject}</span>,
    },
    {
      title: t('communications.columns.body'),
      dataIndex: 'body',
      key: 'body',
      render: (body: string, record: any) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {body || <span style={{ opacity: 0.5 }}>-</span>}
        </div>
      ),
    },
    {
      title: t('communications.columns.sentAt'),
      dataIndex: 'sent_at',
      key: 'sent_at',
      render: (date: string, record: any) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => {
        if (!a.sent_at) return -1;
        if (!b.sent_at) return 1;
        return new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
      },
    },
    {
      title: t('communications.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="communications:read">
            
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('communications.title')}
        subtitle={t('communications.subtitle')}
        extra={
          <PermissionGuard permission="communications:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/communications/new')}>
              {t('communications.newCommunication')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('communications.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
        <Select
          placeholder={t('communications.filterPlaceholder')}
          allowClear
          value={channelFilter}
          onChange={(value) => { setChannelFilter(value); setPage(1); }}
          style={{ width: 200 }}
          options={[
            { value: 'email', label: t('communications.channels.email') },
            { value: 'sms', label: t('communications.channels.sms') },
            { value: 'whatsapp', label: t('communications.channels.whatsapp') },
            { value: 'push', label: t('communications.channels.push') },
            { value: 'in_app', label: t('communications.channels.inApp') },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={communications}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('communications.paginationTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setPage(1);
            }
          },
        }}
      />
    </div>
  );
}