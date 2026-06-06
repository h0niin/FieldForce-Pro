/**
 * Dashboard Widgets Library
 * Reusable widgets for building custom dashboards
 */

import { Card, Statistic, Progress, Table, Tag, Empty, Space, Typography, List, Avatar, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

const { Text } = Typography;

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Widget type definitions
export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  data?: any;
  config?: any;
  size?: 'small' | 'medium' | 'large' | 'full';
}

// Widget size mappings (grid columns)
export const widgetSizes = {
  small: 6,  // 1/4 width
  medium: 12, // 1/2 width
  large: 18,  // 3/4 width
  full: 24,   // full width
};

/**
 * KPI Widget - Display single metric
 */
export function KPIWidget({ title, value, prefix, suffix, trend, color }: any) {
  const { t } = useTranslation();
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={
          trend ? (
            <Space>
              {suffix}
              <Text
                type={trend.direction === 'up' ? 'success' : 'danger'}
                style={{ fontSize: 14 }}
              >
                {trend.direction === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {trend.value}%
              </Text>
            </Space>
          ) : (
            suffix
          )
        }
        valueStyle={{ color }}
      />
    </Card>
  );
}

/**
 * Progress Widget - Display progress with percentage
 */
export function ProgressWidget({ title, current, total, status = 'active' }: any) {
  const { t } = useTranslation();
  const percent = Math.round((current / total) * 100);

  return (
    <Card title={title}>
      <div style={{ padding: '20px 0' }}>
        <Progress
          percent={percent}
          status={status}
          strokeColor={
            status === 'active'
              ? { from: '#108ee9', to: '#87d068' }
              : undefined
          }
        />
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Text strong style={{ fontSize: 16 }}>
            {current} / {total}
          </Text>
        </div>
      </div>
    </Card>
  );
}

/**
 * Chart Widget - Line Chart
 */
export function LineChartWidget({ title, data, labels }: any) {
  const { t } = useTranslation();
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Card title={title}>
      <div style={{ height: 250 }}>
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Bar Chart Widget
 */
export function BarChartWidget({ title, data, labels, color = '#1890ff' }: any) {
  const { t } = useTranslation();
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: color,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Card title={title}>
      <div style={{ height: 250 }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Pie Chart Widget
 */
export function PieChartWidget({ title, data, labels }: any) {
  const { t } = useTranslation();
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#1890ff',
          '#52c41a',
          '#faad14',
          '#f5222d',
          '#722ed1',
          '#13c2c2',
        ],
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <Card title={title}>
      <div style={{ height: 250 }}>
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Doughnut Chart Widget
 */
export function DoughnutChartWidget({ title, data, labels }: any) {
  const { t } = useTranslation();
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#1890ff',
          '#52c41a',
          '#faad14',
          '#f5222d',
          '#722ed1',
          '#13c2c2',
        ],
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <Card title={title}>
      <div style={{ height: 250 }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
}

/**
 * Table Widget - Display data in table format
 */
export function TableWidget({ title, dataSource, columns }: any) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 5, size: 'small' }}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
}

/**
 * List Widget - Display items in list format
 */
export function ListWidget({ title, items }: any) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      <List
        size="small"
        dataSource={items}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={item.icon || <FileTextOutlined />} />}
              title={item.title}
              description={item.description}
            />
            {item.badge && <Badge count={item.badge} />}
          </List.Item>
        )}
      />
    </Card>
  );
}

/**
 * Activity Feed Widget
 */
export function ActivityFeedWidget({ title, activities }: any) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      {activities.length === 0 ? (
        <Empty description={t('dashboard.noRecentActivity')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={activities}
          renderItem={(activity: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: activity.type === 'success' ? '#52c41a' : '#1890ff',
                    }}
                  >
                    {activity.icon}
                  </Avatar>
                }
                title={activity.title}
                description={
                  <Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {activity.time}
                    </Text>
                    {activity.tag && <Tag color={activity.tagColor}>{activity.tag}</Tag>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

/**
 * Status Overview Widget
 */
export function StatusOverviewWidget({ title, statuses }: any) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {statuses.map((status: any) => (
          <div key={status.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Space>
                <Tag color={status.color}>{status.label}</Tag>
              </Space>
              <Text strong>{status.count}</Text>
            </div>
            <Progress
              percent={Math.round((status.count / status.total) * 100)}
              strokeColor={status.color}
              showInfo={false}
            />
          </div>
        ))}
      </Space>
    </Card>
  );
}

/**
 * Metric Cards Widget - Multiple small KPIs
 */
export function MetricCardsWidget({ title, metrics }: any) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {metrics.map((metric: any, index: number) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: '#fafafa',
              borderRadius: 8,
            }}
          >
            <Space>
              <div style={{ fontSize: 24, color: metric.color }}>{metric.icon}</div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {metric.label}
                </Text>
                <div>
                  <Text strong style={{ fontSize: 18 }}>
                    {metric.value}
                  </Text>
                </div>
              </div>
            </Space>
            {metric.trend && (
              <Tag color={metric.trend.direction === 'up' ? 'success' : 'error'}>
                {metric.trend.direction === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {metric.trend.value}%
              </Tag>
            )}
          </div>
        ))}
      </Space>
    </Card>
  );
}

/**
 * Alerts Widget
 */
export function AlertsWidget({ title, alerts }: any) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      {alerts.length === 0 ? (
        <Empty description={t('dashboard.noAlerts')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {alerts.map((alert: any, index: number) => (
            <div
              key={index}
              style={{
                padding: 12,
                border: `1px solid ${
                  alert.severity === 'critical'
                    ? '#ff4d4f'
                    : alert.severity === 'warning'
                    ? '#faad14'
                    : '#1890ff'
                }`,
                borderRadius: 6,
                backgroundColor:
                  alert.severity === 'critical'
                    ? '#fff1f0'
                    : alert.severity === 'warning'
                    ? '#fffbe6'
                    : '#e6f7ff',
              }}
            >
              <Space>
                {alert.severity === 'critical' && <WarningOutlined style={{ color: '#ff4d4f' }} />}
                {alert.severity === 'warning' && <WarningOutlined style={{ color: '#faad14' }} />}
                {alert.severity === 'info' && <CheckCircleOutlined style={{ color: '#1890ff' }} />}
                <div>
                  <Text strong>{alert.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {alert.message}
                  </Text>
                </div>
              </Space>
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
}

/**
 * Widget Type Registry
 */
export const widgetTypes = [
  {
    type: 'kpi',
    name: 'KPI Metric',
    icon: <DollarOutlined />,
    description: 'Single key performance indicator',
    component: KPIWidget,
    defaultSize: 'small',
  },
  {
    type: 'progress',
    name: 'Progress Bar',
    icon: <ClockCircleOutlined />,
    description: 'Progress indicator with percentage',
    component: ProgressWidget,
    defaultSize: 'small',
  },
  {
    type: 'line-chart',
    name: 'Line Chart',
    icon: <LineElement />,
    description: 'Trend visualization',
    component: LineChartWidget,
    defaultSize: 'medium',
  },
  {
    type: 'bar-chart',
    name: 'Bar Chart',
    icon: <BarElement />,
    description: 'Comparison visualization',
    component: BarChartWidget,
    defaultSize: 'medium',
  },
  {
    type: 'pie-chart',
    name: 'Pie Chart',
    icon: <ArcElement />,
    description: 'Distribution visualization',
    component: PieChartWidget,
    defaultSize: 'small',
  },
  {
    type: 'doughnut-chart',
    name: 'Doughnut Chart',
    icon: <ArcElement />,
    description: 'Distribution with center space',
    component: DoughnutChartWidget,
    defaultSize: 'small',
  },
  {
    type: 'table',
    name: 'Data Table',
    icon: <FileTextOutlined />,
    description: 'Tabular data display',
    component: TableWidget,
    defaultSize: 'full',
  },
  {
    type: 'list',
    name: 'List',
    icon: <FileTextOutlined />,
    description: 'Item list display',
    component: ListWidget,
    defaultSize: 'medium',
  },
  {
    type: 'activity-feed',
    name: 'Activity Feed',
    icon: <UserOutlined />,
    description: 'Recent activities timeline',
    component: ActivityFeedWidget,
    defaultSize: 'medium',
  },
  {
    type: 'status-overview',
    name: 'Status Overview',
    icon: <CheckCircleOutlined />,
    description: 'Status breakdown with progress',
    component: StatusOverviewWidget,
    defaultSize: 'medium',
  },
  {
    type: 'metric-cards',
    name: 'Metric Cards',
    icon: <DollarOutlined />,
    description: 'Multiple KPIs in compact format',
    component: MetricCardsWidget,
    defaultSize: 'medium',
  },
  {
    type: 'alerts',
    name: 'Alerts',
    icon: <WarningOutlined />,
    description: 'Important notifications and alerts',
    component: AlertsWidget,
    defaultSize: 'medium',
  },
];

/**
 * Get widget component by type
 */
export function getWidgetComponent(type: string) {
  const widget = widgetTypes.find((w) => w.type === type);
  return widget?.component || null;
}