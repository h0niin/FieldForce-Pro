import { Row, Col, Card, Statistic, Typography, Table } from 'antd';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import {
  DollarOutlined,
  TeamOutlined,
  ClusterOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { 
  useSuperAdminAnalyticsOverview, 
  useSuperAdminRevenueTrends, 
  useSuperAdminAdoptionMetrics 
} from '@/hooks/use-super-admin-analytics';

const { Title, Text } = Typography;

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation();
  const { data: overview, isLoading: overviewLoading } = useSuperAdminAnalyticsOverview();
  const { data: revenueTrends, isLoading: trendsLoading } = useSuperAdminRevenueTrends('monthly');
  const { data: adoption, isLoading: adoptionLoading } = useSuperAdminAdoptionMetrics();

  const adoptionColumns = [
    { title: t('analytics.subscriptionPlan'), dataIndex: 'subscription_plan', key: 'plan', render: (text: string) => <Text style={{ textTransform: 'capitalize' }}>{text}</Text> },
    { title: t('analytics.numberOfTenants'), dataIndex: 'count', key: 'count' },
  ];

  return (
    <div>
      <PageHeader
        title={t('analytics.usageBillingAnalytics')}
        subtitle={t('analytics.insightsIntoPlatformAdoption')}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title={t('analytics.monthlyRecurringRevenue')}
              value={overview?.revenue.mrr ?? 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title={t('analytics.totalRevenue')}
              value={overview?.revenue.total ?? 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title={t('analytics.activeUsers')}
              value={overview?.users.active ?? 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={overviewLoading}>
            <Statistic
              title={t('analytics.totalWorkOrders')}
              value={overview?.work_orders.total ?? 0}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={t('analytics.revenueTrends')} loading={trendsLoading} style={{ height: '100%' }}>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <AreaChart data={revenueTrends || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#1677ff" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('analytics.adoptionByPlan')} loading={adoptionLoading} style={{ height: '100%' }}>
            <Table
              dataSource={adoption?.by_plan || []}
              columns={adoptionColumns}
              rowKey="subscription_plan"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}