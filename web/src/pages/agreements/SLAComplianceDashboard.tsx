import { useState } from 'react';
import { Card, Row, Col, Typography, Progress, Tag, Table, Statistic, Space, Select, Button, Empty } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServiceAgreements } from '@/hooks/use-service-agreements';
import PageHeader from '@/components/common/PageHeader';
import { formatDate } from '@/utils/format-date';
import type { ServiceAgreement } from '@/types/models.types';

const { Title, Text } = Typography;

interface SLAMetrics {
  agreementId: string;
  agreementName: string;
  responseTimeCompliance: number;
  resolutionTimeCompliance: number;
  totalRequests: number;
  breaches: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

function calculateSLAMetrics(agreement: ServiceAgreement): SLAMetrics {
  // Mock calculation - in real implementation, this would use actual data
  const responseCompliance = Math.floor(Math.random() * 30) + 70; // 70-100%
  const resolutionCompliance = Math.floor(Math.random() * 30) + 70; // 70-100%
  const totalRequests = Math.floor(Math.random() * 100) + 20;
  const breaches = Math.floor(Math.random() * 10);

  const avgCompliance = (responseCompliance + resolutionCompliance) / 2;
  let status: SLAMetrics['status'] = 'excellent';
  if (avgCompliance < 95) status = 'good';
  if (avgCompliance < 85) status = 'warning';
  if (avgCompliance < 75) status = 'critical';

  return {
    agreementId: agreement.id,
    agreementName: agreement.agreement_number || 'N/A',
    responseTimeCompliance: responseCompliance,
    resolutionTimeCompliance: resolutionCompliance,
    totalRequests,
    breaches,
    status,
  };
}

const statusColors: Record<string, string> = {
  excellent: '#52c41a',
  good: '#1890ff',
  warning: '#faad14',
  critical: '#ff4d4f',
};

export default function SLAComplianceDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30d');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const statusLabels: Record<string, string> = {
    excellent: t('slaDashboard.status.excellent'),
    good: t('slaDashboard.status.good'),
    warning: t('slaDashboard.status.warning'),
    critical: t('slaDashboard.status.critical'),
  };

  const { data: agreementsData, isLoading, refetch } = useServiceAgreements({ page: 1, take: 100 });
  const agreements = agreementsData?.data || [];

  // Calculate metrics for all agreements
  const slaMetrics = agreements.map(calculateSLAMetrics);

  // Filter by status
  const filteredMetrics = statusFilter
    ? slaMetrics.filter((m) => m.status === statusFilter)
    : slaMetrics;

  // Calculate overall statistics
  const avgResponseCompliance =
    slaMetrics.length > 0
      ? slaMetrics.reduce((sum, m) => sum + m.responseTimeCompliance, 0) / slaMetrics.length
      : 0;

  const avgResolutionCompliance =
    slaMetrics.length > 0
      ? slaMetrics.reduce((sum, m) => sum + m.resolutionTimeCompliance, 0) / slaMetrics.length
      : 0;

  const totalBreaches = slaMetrics.reduce((sum, m) => sum + m.breaches, 0);
  const criticalCount = slaMetrics.filter((m) => m.status === 'critical').length;
  const warningCount = slaMetrics.filter((m) => m.status === 'warning').length;

  const columns = [
    {
      title: t('slaDashboard.table.agreement'),
      dataIndex: 'agreementName',
      key: 'agreementName',
      render: (text: string, record: SLAMetrics) => (
        <Button
          type="link"
          onClick={() => navigate(`/agreements/${record.agreementId}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('slaDashboard.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status].toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: t('slaDashboard.status.excellent'), value: 'excellent' },
        { text: t('slaDashboard.status.good'), value: 'good' },
        { text: t('slaDashboard.status.warning'), value: 'warning' },
        { text: t('slaDashboard.status.critical'), value: 'critical' },
      ],
      onFilter: (value: string | number | boolean, record: SLAMetrics) => record.status === value,
    },
    {
      title: t('slaDashboard.table.responseTimeCompliance'),
      dataIndex: 'responseTimeCompliance',
      key: 'responseTimeCompliance',
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={value}
            size="small"
            style={{ width: 100 }}
            strokeColor={value >= 95 ? '#52c41a' : value >= 85 ? '#1890ff' : value >= 75 ? '#faad14' : '#ff4d4f'}
          />
          <Text>{value}%</Text>
        </div>
      ),
      sorter: (a: SLAMetrics, b: SLAMetrics) => a.responseTimeCompliance - b.responseTimeCompliance,
    },
    {
      title: t('slaDashboard.table.resolutionTimeCompliance'),
      dataIndex: 'resolutionTimeCompliance',
      key: 'resolutionTimeCompliance',
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={value}
            size="small"
            style={{ width: 100 }}
            strokeColor={value >= 95 ? '#52c41a' : value >= 85 ? '#1890ff' : value >= 75 ? '#faad14' : '#ff4d4f'}
          />
          <Text>{value}%</Text>
        </div>
      ),
      sorter: (a: SLAMetrics, b: SLAMetrics) => a.resolutionTimeCompliance - b.resolutionTimeCompliance,
    },
    {
      title: t('slaDashboard.table.totalRequests'),
      dataIndex: 'totalRequests',
      key: 'totalRequests',
      sorter: (a: SLAMetrics, b: SLAMetrics) => a.totalRequests - b.totalRequests,
    },
    {
      title: t('slaDashboard.table.breaches'),
      dataIndex: 'breaches',
      key: 'breaches',
      render: (value: number) => (
        <Tag color={value === 0 ? 'green' : value < 5 ? 'orange' : 'red'}>
          {value}
        </Tag>
      ),
      sorter: (a: SLAMetrics, b: SLAMetrics) => a.breaches - b.breaches,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('slaDashboard.title')}
        subtitle={t('slaDashboard.subtitle')}
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Space>
              <Text type="secondary">{t('slaDashboard.filters.timeRange')}:</Text>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                style={{ width: 150 }}
                options={[
                  { value: '7d', label: t('slaDashboard.ranges.7d') },
                  { value: '30d', label: t('slaDashboard.ranges.30d') },
                  { value: '90d', label: t('slaDashboard.ranges.90d') },
                  { value: '1y', label: t('slaDashboard.ranges.1y') },
                ]}
              />
              <Text type="secondary">{t('slaDashboard.filters.status')}:</Text>
              <Select
                placeholder={t('slaDashboard.filters.allStatuses')}
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                options={[
                  { value: 'excellent', label: t('slaDashboard.status.excellent') },
                  { value: 'good', label: t('slaDashboard.status.good') },
                  { value: 'warning', label: t('slaDashboard.status.warning') },
                  { value: 'critical', label: t('slaDashboard.status.critical') },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              {t('common.refresh')}
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('slaDashboard.stats.avgResponseCompliance')}
              value={avgResponseCompliance.toFixed(1)}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: avgResponseCompliance >= 95 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('slaDashboard.stats.avgResolutionCompliance')}
              value={avgResolutionCompliance.toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: avgResolutionCompliance >= 95 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('slaDashboard.stats.atRiskAgreements')}
              value={warningCount + criticalCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: warningCount + criticalCount > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('slaDashboard.stats.totalBreaches')}
              value={totalBreaches}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: totalBreaches > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {criticalCount > 0 && (
        <Card
          style={{
            marginBottom: 16,
            borderColor: '#ff4d4f',
            backgroundColor: '#fff1f0',
          }}
        >
          <Space>
            <WarningOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
            <div>
              <Text strong style={{ color: '#ff4d4f' }}>
                {t('slaDashboard.alerts.criticalTitle')}:
              </Text>
              <Text style={{ marginLeft: 8 }}>
                {t('slaDashboard.alerts.criticalMessage', { count: criticalCount })}
              </Text>
            </div>
          </Space>
        </Card>
      )}

      <Card title={t('slaDashboard.table.title')}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>{t('common.loading')}</div>
        ) : filteredMetrics.length === 0 ? (
          <Empty description={t('slaDashboard.table.noData')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredMetrics}
            rowKey="agreementId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => t('slaDashboard.table.paginationTotal', { total }),
            }}
          />
        )}
      </Card>
    </div>
  );
}