import { Card, Select } from 'antd';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface RevenueChartProps {
  data?: Array<{ name: string; value: number }>;
}

const defaultData = [
  { name: 'Mon', value: 2400 },
  { name: 'Tue', value: 3200 },
  { name: 'Wed', value: 2800 },
  { name: 'Thu', value: 3800 },
  { name: 'Fri', value: 4200 },
  { name: 'Sat', value: 3600 },
  { name: 'Sun', value: 4000 },
];

export default function RevenueChart({ data = defaultData }: RevenueChartProps) {
  const { t } = useTranslation();

  return (
    <Card
      title={
        <span style={{ fontSize: 16, fontWeight: 600 }}>{t('revenueChart.revenueOverview')}</span>
      }
      extra={
        <Select defaultValue="weekly" style={{ width: 120 }} bordered={false}>
          <Option value="daily">{t('revenueChart.daily')}</Option>
          <Option value="weekly">{t('revenueChart.weekly')}</Option>
          <Option value="monthly">{t('revenueChart.monthly')}</Option>
          <Option value="yearly">{t('revenueChart.yearly')}</Option>
        </Select>
      }
      style={{
        borderRadius: 12,
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8c8c8c', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8c8c8c', fontSize: 12 }}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number | undefined) => [`$${value?.toLocaleString() || '0'}`, t('revenueChart.revenue')]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#4CAF50"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}