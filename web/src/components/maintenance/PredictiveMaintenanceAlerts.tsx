import { Card, List, Tag, Typography, Space, Button, Empty } from 'antd';
import {
  AlertOutlined,
  WarningOutlined,
  ToolOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface PredictiveAlert {
  id: string;
  equipment_id: string;
  equipment_name: string;
  risk_level: 'medium' | 'high' | 'critical';
  health_score: number;
  failure_probability: number;
  predicted_failure_date: string | null;
  recommended_action: string;
}

interface PredictiveMaintenanceAlertsProps {
  alerts?: PredictiveAlert[];
  loading?: boolean;
  onCreateWorkOrder?: (alert: PredictiveAlert) => void;
  onViewDetails?: (alert: PredictiveAlert) => void;
}

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: 'red', label: 'CRITICAL' },
  high: { color: 'orange', label: 'HIGH RISK' },
  medium: { color: 'gold', label: 'WARNING' },
};

const DEMO_ALERTS: PredictiveAlert[] = [
  {
    id: '1',
    equipment_id: 'eq-4',
    equipment_name: 'Pump D-410',
    risk_level: 'critical',
    health_score: 15,
    failure_probability: 0.85,
    predicted_failure_date: '2026-02-25',
    recommended_action: 'URGENT: Schedule immediate inspection; Consider preventive replacement',
  },
  {
    id: '2',
    equipment_id: 'eq-3',
    equipment_name: 'Compressor C-302',
    risk_level: 'high',
    health_score: 38,
    failure_probability: 0.62,
    predicted_failure_date: '2026-03-20',
    recommended_action: 'Schedule overdue maintenance immediately; Review maintenance procedures',
  },
  {
    id: '3',
    equipment_id: 'eq-6',
    equipment_name: 'Boiler F-102',
    risk_level: 'medium',
    health_score: 55,
    failure_probability: 0.45,
    predicted_failure_date: '2026-05-10',
    recommended_action: 'Schedule maintenance in next available window',
  },
];

export default function PredictiveMaintenanceAlerts({
  alerts = DEMO_ALERTS,
  loading = false,
  onCreateWorkOrder,
  onViewDetails,
}: PredictiveMaintenanceAlertsProps) {
  const { t } = useTranslation();

  if (!alerts.length && !loading) {
    return (
      <Card title={<><AlertOutlined /> {t('predictiveMaintenance.title')}</>}>
        <Empty description={t('predictiveMaintenance.noActiveAlerts')} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <AlertOutlined />
          <span>{t('predictiveMaintenance.title')}</span>
          <Tag color="red">{alerts.length}</Tag>
        </Space>
      }
    >
      <List
        loading={loading}
        dataSource={alerts}
        renderItem={(alert) => {
          const config = SEVERITY_CONFIG[alert.risk_level] || SEVERITY_CONFIG.medium;
          return (
            <List.Item
              actions={[
                <Button
                  key="wo"
                  type="primary"
                  size="small"
                  icon={<ToolOutlined />}
                  onClick={() => onCreateWorkOrder?.(alert)}
                >
                  {t('predictiveMaintenance.createWo')}
                </Button>,
                <Button
                  key="view"
                  size="small"
                  onClick={() => onViewDetails?.(alert)}
                >
                  {t('predictiveMaintenance.details')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Tag color={config.color} style={{ marginTop: 4 }}>
                    <WarningOutlined /> {t(`predictiveMaintenance.severity.${alert.risk_level}`)}
                  </Tag>
                }
                title={
                  <Space>
                    <Text strong>{alert.equipment_name}</Text>
                    <Text type="secondary">{t('predictiveMaintenance.health', { score: alert.health_score })}</Text>
                    <Text type="danger">
                      {t('predictiveMaintenance.failureRisk', { probability: (alert.failure_probability * 100).toFixed(0) })}
                    </Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Text>{alert.recommended_action}</Text>
                    {alert.predicted_failure_date && (
                      <Text type="danger">
                        <CalendarOutlined /> {t('predictiveMaintenance.predictedFailure', { date: alert.predicted_failure_date })}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}