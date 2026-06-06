import { Card, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

const { Text, Title } = Typography;

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon?: ReactNode;
  color?: string;
}

export default function StatsCard({ title, value, trend, icon, color = '#4CAF50' }: StatsCardProps) {
  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        height: '100%',
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
            {title}
          </Text>
          <Title level={2} style={{ margin: '8px 0', fontWeight: 600 }}>
            {value}
          </Title>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  color: trend.isPositive ? '#4CAF50' : '#f44336',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {trend.isPositive ? (
                  <ArrowUpOutlined style={{ fontSize: 12 }} />
                ) : (
                  <ArrowDownOutlined style={{ fontSize: 12 }} />
                )}
                {trend.value}
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {trend.label}
              </Text>
            </div>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              fontSize: 24,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
