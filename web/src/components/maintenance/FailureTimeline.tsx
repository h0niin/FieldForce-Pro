import { Card, Timeline, Tag, Typography, Empty } from 'antd';
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface FailureEvent {
  date: string;
  equipment_name: string;
  event_type: 'predicted_failure' | 'maintenance_due' | 'anomaly_detected' | 'maintenance_completed';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface FailureTimelineProps {
  events?: FailureEvent[];
  loading?: boolean;
}

export default function FailureTimeline({
  events = DEMO_EVENTS,
  loading = false,
}: FailureTimelineProps) {
  const { t } = useTranslation();

  const EVENT_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    predicted_failure: { color: 'red', icon: <WarningOutlined />, label: t('failureTimeline.labels.predictedFailure') },
    maintenance_due: { color: 'orange', icon: <ClockCircleOutlined />, label: t('failureTimeline.labels.maintenanceDue') },
    anomaly_detected: { color: 'gold', icon: <ExclamationCircleOutlined />, label: t('failureTimeline.labels.anomaly') },
    maintenance_completed: { color: 'green', icon: <CheckCircleOutlined />, label: t('failureTimeline.labels.completed') },
  };

  const DEMO_EVENTS: FailureEvent[] = [
    { date: '2026-02-25', equipment_name: 'Pump D-410', event_type: 'predicted_failure', description: t('failureTimeline.descriptions.pumpD410'), severity: 'critical' },
    { date: '2026-03-01', equipment_name: 'Compressor C-302', event_type: 'maintenance_due', description: t('failureTimeline.descriptions.compressorC302Due'), severity: 'high' },
    { date: '2026-03-15', equipment_name: 'Boiler F-102', event_type: 'anomaly_detected', description: t('failureTimeline.descriptions.boilerF102'), severity: 'medium' },
    { date: '2026-03-20', equipment_name: 'Compressor C-302', event_type: 'predicted_failure', description: t('failureTimeline.descriptions.compressorC302Predicted'), severity: 'high' },
    { date: '2026-04-01', equipment_name: 'Generator B-205', event_type: 'maintenance_due', description: t('failureTimeline.descriptions.generatorB205'), severity: 'medium' },
    { date: '2026-01-28', equipment_name: 'Elevator E-001', event_type: 'maintenance_completed', description: t('failureTimeline.descriptions.elevatorE001'), severity: 'low' },
  ];

  if (!events.length && !loading) {
    return (
      <Card title={t('failureTimeline.title')}>
        <Empty description={t('failureTimeline.noEvents')} />
      </Card>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card title={t('failureTimeline.title')} loading={loading}>
      <Timeline
        items={sortedEvents.map((event) => {
          const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.anomaly_detected;
          return {
            color: config.color,
            dot: config.icon,
            children: (
              <div>
                <div>
                  <Text strong>{event.equipment_name}</Text>
                  {' '}
                  <Tag color={config.color} style={{ fontSize: 11 }}>
                    {config.label}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {event.date}
                </Text>
                <br />
                <Text>{event.description}</Text>
              </div>
            ),
          };
        })}
      />
    </Card>
  );
}