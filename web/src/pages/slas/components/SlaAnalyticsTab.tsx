import React from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Spin, Table } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSlaAnalytics } from '@/hooks/use-slas';

const { Title, Text } = Typography;

export default function SlaAnalyticsTab() {
  const { data, isLoading } = useSlaAnalytics();
  const { t } = useTranslation();

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const compliancePercentage = data?.compliancePercentage || 0;
  const totalBreached = data?.totalBreached || 0;
  const totalMet = data?.totalMet || 0;
  const averageResolutionTime = data?.averageResolutionTime || '0m';

  const recentBreaches = data?.recentBreaches || [];

  const columns = [
    {
      title: t('sla.entityType', 'Entity Type'),
      dataIndex: 'entityType',
      key: 'entityType',
    },
    {
      title: t('sla.entityNumber', 'Entity Number'),
      dataIndex: 'entityNumber',
      key: 'entityNumber',
    },
    {
      title: t('sla.breachType', 'Breach Type'),
      dataIndex: 'breachType',
      key: 'breachType',
    },
    {
      title: t('sla.deadline', 'Deadline'),
      dataIndex: 'deadline',
      key: 'deadline',
      render: (text: string) => new Date(text).toLocaleString(),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>{t('sla.analytics', 'Reporting Analytics')}</Title>
        <Text type="secondary">{t('sla.analyticsDesc', 'Monitor your SLA compliance rates and team performance.')}</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('sla.compliancePercentage', 'SLA Compliance %')}
              value={compliancePercentage}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress 
              percent={compliancePercentage} 
              status="active" 
              strokeColor={{ from: '#108ee9', to: '#87d068' }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('sla.totalBreachedRequests', 'Total Breached Requests')}
              value={totalBreached}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              {t('sla.requestsExceedingAllowedSla', 'Requests exceeding allowed SLA')}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('sla.totalMetRequests', 'Total Met Requests')}
              value={totalMet}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              {t('sla.requestsResolvedWithinSla', 'Requests resolved within SLA')}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('sla.avgResolutionTime', 'Avg. Resolution Time')}
              value={averageResolutionTime}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              {t('sla.acrossAllCategoriesThisMonth', 'Across all categories this month')}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title={t('sla.recentBreaches', 'Recent Breaches')}>
            <Table 
              dataSource={recentBreaches} 
              columns={columns} 
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
