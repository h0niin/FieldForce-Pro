import { useState } from 'react';
import { Card, Table, Typography, Space, Tag, Input, Select, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/common/PageHeader';
import { useSuperAdminAuditLogs, useExportSuperAdminAuditLogs } from '@/hooks/use-super-admin-audit-logs';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useSuperAdminAuditLogs({ page, limit, action: actionFilter });
  const exportMutation = useExportSuperAdminAuditLogs();

  const handleExport = async () => {
    const { data } = await exportMutation.refetch();
    if (data) {
      // Basic CSV export logic
      const headers = [
        t('auditLogs.id'), 
        t('auditLogs.action'), 
        t('auditLogs.resource'), 
        t('auditLogs.targetId'), 
        t('auditLogs.ipAddress'), 
        t('auditLogs.createdAt')
      ];
      const csvData = data.map((log: any) => [
        log.id,
        log.action,
        log.resource,
        log.target_id || '',
        log.ip_address || '',
        formatDateTime(log.created_at)
      ].join(','));
      
      const csv = [headers.join(','), ...csvData].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
      a.click();
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: t('auditLogs.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <Text>{formatDateTime(date)}</Text>,
    },
    {
      title: t('auditLogs.action'),
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: t('auditLogs.resource'),
      dataIndex: 'resource',
      key: 'resource',
    },
    {
      title: t('auditLogs.targetId'),
      dataIndex: 'target_id',
      key: 'target_id',
      render: (id: string) => <Text copyable>{id}</Text>,
    },
    {
      title: t('auditLogs.ipAddress'),
      dataIndex: 'ip_address',
      key: 'ip_address',
    },
    {
      title: t('auditLogs.details'),
      dataIndex: 'details',
      key: 'details',
      render: (details: any) => (
        <Text type="secondary" ellipsis={{ tooltip: JSON.stringify(details) }}>
          {details ? JSON.stringify(details) : '--'}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('auditLogs.title')}
        subtitle={t('auditLogs.subtitle')}
        extra={[
          <Button 
            key="export" 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            loading={exportMutation.isFetching}
          >
            {t('auditLogs.exportCsv')}
          </Button>
        ]}
      />

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder={t('auditLogs.filterByAction')}
            onChange={setActionFilter}
            options={[
              { value: 'CREATE_API_KEY', label: t('auditLogs.actions.createApiKey') },
              { value: 'REVOKE_API_KEY', label: t('auditLogs.actions.revokeApiKey') },
              { value: 'REGENERATE_API_KEY', label: t('auditLogs.actions.regenerateApiKey') },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: limit,
            total: data?.meta.total || 0,
            onChange: (p, s) => {
              setPage(p);
              setLimit(s);
            },
          }}
        />
      </Card>
    </div>
  );
}