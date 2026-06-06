import { Card, Progress, Typography, Space, Tag } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface HealthScoreGaugeProps {
  score: number;
  equipmentName?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  loading?: boolean;
}

export default function HealthScoreGauge({
  score,
  equipmentName,
  riskLevel,
  loading = false,
}: HealthScoreGaugeProps) {
  const { t } = useTranslation();

  const RISK_CONFIG: Record<string, { color: string; strokeColor: string; label: string }> = {
    low: { color: 'green', strokeColor: '#52c41a', label: t('healthScoreGauge.riskLevel.low') },
    medium: { color: 'orange', strokeColor: '#faad14', label: t('healthScoreGauge.riskLevel.medium') },
    high: { color: 'red', strokeColor: '#ff4d4f', label: t('healthScoreGauge.riskLevel.high') },
    critical: { color: 'magenta', strokeColor: '#cf1322', label: t('healthScoreGauge.riskLevel.critical') },
  };

  function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  const effectiveRisk = riskLevel || getRiskLevel(score);
  const config = RISK_CONFIG[effectiveRisk];

  return (
    <Card loading={loading} style={{ textAlign: 'center' }}>
      <Space direction="vertical" align="center" size="small">
        {equipmentName && <Text strong>{equipmentName}</Text>}
        <Progress
          type="dashboard"
          percent={score}
          strokeColor={config.strokeColor}
          format={(percent) => (
            <div>
              <HeartOutlined style={{ fontSize: 20, color: config.strokeColor }} />
              <br />
              <span style={{ fontSize: 24, fontWeight: 'bold' }}>{percent}</span>
            </div>
          )}
          size={150}
        />
        <Tag color={config.color}>{config.label}</Tag>
      </Space>
    </Card>
  );
}