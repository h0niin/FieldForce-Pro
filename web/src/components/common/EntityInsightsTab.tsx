import React from 'react';
import { Card, Row, Col, Statistic, Skeleton, Typography } from 'antd';
import { 
  FileTextOutlined, 
  CalculatorOutlined, 
  ToolOutlined, 
  CalendarOutlined,
  WarningOutlined,
  DollarOutlined 
} from '@ant-design/icons';
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
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  const insightsData = insights || {};

  return (
    <Card title="Insights">
      <Typography.Paragraph type="secondary">
        Monitor and analyze the {entityType.toLowerCase()}'s data in real-time. Glean insights that will empower you to enhance and optimize your services...
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Open Requests"
              value={insightsData.open_requests ?? 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Open Estimates"
              value={insightsData.open_estimates ?? 0}
              prefix={<CalculatorOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Open Work Orders"
              value={insightsData.open_work_orders ?? 0}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Open Appointments"
              value={insightsData.open_service_appointments ?? 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Overdue Work Orders"
              value={insightsData.overdue_work_orders ?? 0}
              prefix={<WarningOutlined />}
              valueStyle={(insightsData.overdue_work_orders ?? 0) > 0 ? { color: '#cf1322' } : { color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Overdue Appointments"
              value={insightsData.overdue_service_appointments ?? 0}
              prefix={<WarningOutlined />}
              valueStyle={(insightsData.overdue_service_appointments ?? 0) > 0 ? { color: '#cf1322' } : { color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Overdue Invoices"
              value={insightsData.overdue_invoices ?? 0}
              prefix={<WarningOutlined />}
              valueStyle={(insightsData.overdue_invoices ?? 0) > 0 ? { color: '#cf1322' } : { color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false}>
            <Statistic
              title="Amount Generated"
              value={insightsData.amount_generated_from_work_orders ?? 0}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};
