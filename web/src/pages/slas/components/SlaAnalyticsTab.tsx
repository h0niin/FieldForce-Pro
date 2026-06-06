import React from 'react';
import { Row, Col, Card, Statistic, Typography, Progress } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SlaAnalyticsTab() {
  // Mock Data
  const compliancePercentage = 94.5;
  const totalBreached = 12;
  const totalMet = 345;
  const averageResolutionTime = '2h 15m';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Reporting Analytics</Title>
        <Text type="secondary">Monitor your SLA compliance rates and team performance.</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="SLA Compliance %"
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
              title="Total Breached Requests"
              value={totalBreached}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              Requests exceeding allowed SLA
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Met Requests"
              value={totalMet}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              Requests resolved within SLA
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg. Resolution Time"
              value={averageResolutionTime}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
              Across all categories this month
            </Text>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Recent Breaches (Mock)">
            <Text type="secondary">Detailed breach logs and performance over time will be available here when connected to the analytics engine.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
