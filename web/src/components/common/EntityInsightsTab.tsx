import React from 'react';
import { Card, Row, Col, Statistic, Skeleton } from 'antd';
import { ProjectOutlined, ToolOutlined, DollarOutlined } from '@ant-design/icons';
import { useCompanyInsights } from '@/hooks/use-companies';
import { useContactInsights } from '@/hooks/use-contacts';

interface EntityInsightsTabProps {
  entityType: 'Company' | 'Contact';
  entityId: string;
}

export const EntityInsightsTab: React.FC<EntityInsightsTabProps> = ({ entityType, entityId }) => {
  const useInsights = entityType === 'Company' ? useCompanyInsights : useContactInsights;
  const { data: insights, isLoading } = useInsights(entityId);

  if (isLoading) {
    return (
      <Card title="Insights">
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  if (!insights) {
    return <Card title="Insights">No data available.</Card>;
  }

  return (
    <Card title="Insights">
      <Row gutter={16}>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Active Assets"
              value={insights.activeAssets}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Open Work Orders"
              value={insights.openWorkOrders}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}>
            <Statistic
              title="Unpaid Invoices"
              value={insights.unpaidInvoices}
              prefix={<DollarOutlined />}
              valueStyle={insights.unpaidInvoices > 0 ? { color: '#cf1322' } : { color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
