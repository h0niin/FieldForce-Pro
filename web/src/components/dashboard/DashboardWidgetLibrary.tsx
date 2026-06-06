import { Card, Statistic, Progress, Table, Tag, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@/utils/format-currency';

const { Title, Text } = Typography;

// ========== KPI Widget ==========
export interface KPIWidgetProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  precision?: number;
  trend?: 'up' | 'down';
  trendValue?: number;
  valueStyle?: React.CSSProperties;
}

export function KPIWidget({
  title,
  value,
  prefix,
  suffix,
  precision,
  trend,
  trendValue,
  valueStyle,
}: KPIWidgetProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        valueStyle={valueStyle}
      />
      {trend && trendValue && (
        <div style={{ marginTop: 8 }}>
          <Tag color={trend === 'up' ? 'green' : 'red'} icon={trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
            {t('kpiWidget.vsLastPeriod', { trendValue })}
          </Tag>
        </div>
      )}
    </Card>
  );
}

// ========== Progress Widget ==========
export interface ProgressWidgetProps {
  title: string;
  percent: number;
  status?: 'success' | 'exception' | 'normal' | 'active';
  type?: 'line' | 'circle' | 'dashboard';
  description?: string;
}

export function ProgressWidget({ title, percent, status, type = 'line', description }: ProgressWidgetProps) {
  return (
    <Card title={title}>
      <Progress
        percent={percent}
        status={status}
        type={type}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
      />
      {description && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
          {description}
        </Text>
      )}
    </Card>
  );
}

// ========== Table Widget ==========
export interface TableWidgetProps<T> {
  title: string;
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  pagination?: boolean;
}

export function TableWidget<T extends { id: string }>({
  title,
  columns,
  dataSource,
  loading,
  pagination = true,
}: TableWidgetProps<T>) {
  return (
    <Card title={title}>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={pagination ? { pageSize: 5, simple: true } : false}
        size="small"
      />
    </Card>
  );
}

// ========== Chart Widget ==========
export interface ChartWidgetProps {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  height?: number;
}

export function ChartWidget({ title, type, data, height = 300 }: ChartWidgetProps) {
  const { t } = useTranslation();
  return (
    <Card title={title}>
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
        <Text type="secondary">
          {t('chartWidget.placeholder', { type: type.toUpperCase() })}
          <div style={{ fontSize: 12, marginTop: 8 }}>{t('chartWidget.installInstruction')}</div>
        </Text>
      </div>
    </Card>
  );
}

// ========== List Widget ==========
export interface ListItem {
  id: string;
  title: string;
  description?: string;
  value?: string | number;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'default';
}

export interface ListWidgetProps {
  title: string;
  items: ListItem[];
  showIcon?: boolean;
}

export function ListWidget({ title, items, showIcon = true }: ListWidgetProps) {
  return (
    <Card title={title}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Space>
              {showIcon && item.icon}
              <div>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                {item.description && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.description}
                  </Text>
                )}
              </div>
            </Space>
            {item.value && (
              <Tag color={item.status || 'default'}>{item.value}</Tag>
            )}
          </div>
        ))}
      </Space>
    </Card>
  );
}

// ========== Metric Comparison Widget ==========
export interface MetricComparisonProps {
  title: string;
  current: number;
  previous: number;
  label: string;
  format?: 'number' | 'currency' | 'percentage';
}

export function MetricComparisonWidget({
  title,
  current,
  previous,
  label,
  format = 'number',
}: MetricComparisonProps) {
  const { t } = useTranslation();
  const change = current - previous;
  const changePercent = previous > 0 ? ((change / previous) * 100).toFixed(1) : 0;
  const isPositive = change > 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card title={title}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: '#1890ff' }}>
          {formatValue(current)}
        </div>
        <Text type="secondary">{label}</Text>
      </div>
      <Space>
        <Tag color={isPositive ? 'success' : 'error'} icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
          {changePercent}%
        </Tag>
        <Text type="secondary">{t('metricComparison.vsPreviousPeriod', { value: formatValue(previous) })}</Text>
      </Space>
    </Card>
  );
}

// ========== Quick Stats Grid ==========
export interface QuickStat {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
}

export interface QuickStatsGridProps {
  stats: QuickStat[];
}

export function QuickStatsGrid({ stats }: QuickStatsGridProps) {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
            }}
          >
            <Space>
              {stat.icon}
              <Text>{stat.label}</Text>
            </Space>
            <div style={{ fontSize: 20, fontWeight: 600, color: stat.color || '#1890ff' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </Space>
    </Card>
  );
}

export const DashboardWidgets = {
  KPIWidget,
  ProgressWidget,
  TableWidget,
  ChartWidget,
  ListWidget,
  MetricComparisonWidget,
  QuickStatsGrid,
};

export default DashboardWidgets;