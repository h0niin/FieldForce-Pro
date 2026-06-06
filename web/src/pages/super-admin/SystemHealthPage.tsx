import { Row, Col, Card, Statistic, Tag, Typography, Progress } from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ConsoleSqlOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { useSuperAdminHealth } from '@/hooks/use-super-admin-health';

const { Title, Text } = Typography;

export default function SystemHealthPage() {
  const { t } = useTranslation();
  const { data: health, isLoading } = useSuperAdminHealth();

  if (isLoading) {
    return <div>{t('systemHealth.loading')}</div>;
  }

  if (!health) {
    return <div>{t('systemHealth.failedToLoad')}</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleOutlined />;
      case 'degraded': return <WarningOutlined />;
      case 'unhealthy': return <CloseCircleOutlined />;
      default: return undefined;
    }
  };

  return (
    <div>
      <PageHeader
        title={t('systemHealth.title')}
        subtitle={t('systemHealth.subtitle')}
      />

      <div style={{ marginBottom: 24 }}>
        <Text strong>{t('systemHealth.overallStatus')}: </Text>
        <Tag color={getStatusColor(health.status)} icon={getStatusIcon(health.status)}>
          {health.status.toUpperCase()}
        </Tag>
        <Text type="secondary" style={{ marginLeft: 16 }}>
          {t('systemHealth.lastChecked')}: {new Date(health.timestamp).toLocaleString()}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card 
            title={<span><ApiOutlined /> {t('systemHealth.services.api')}</span>} 
            extra={<Tag color={getStatusColor(health.services.api.status)}>{health.services.api.status}</Tag>}
          >
            <Statistic
              title={t('systemHealth.uptime')}
              value={Math.floor(health.services.api.uptimeSeconds / 3600)}
              suffix={t('systemHealth.hours')}
              prefix={<ClockCircleOutlined />}
            />
            <div style={{ marginTop: 16 }}>
              <Text>{t('systemHealth.memoryUsage')}</Text>
              <Progress percent={health.services.api.memoryUsage.usedPercentage} status="active" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Math.round(health.services.api.memoryUsage.used / 1024 / 1024)} MB / {Math.round(health.services.api.memoryUsage.total / 1024 / 1024)} MB
              </Text>
            </div>
            <div style={{ marginTop: 16 }}>
              <Text>{t('systemHealth.cpuLoad')}</Text>
              <div>
                <Text strong>{health.services.api.cpuLoad.toFixed(2)}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card 
            title={<span><DatabaseOutlined /> {t('systemHealth.services.database')}</span>}
            extra={<Tag color={getStatusColor(health.services.database.status)}>{health.services.database.status}</Tag>}
          >
            <Statistic
              title={t('systemHealth.queryLatency')}
              value={health.services.database.queryTimeMs}
              suffix={t('systemHealth.ms')}
              prefix={<ConsoleSqlOutlined />}
            />
            {health.services.database.queryTimeMs > 100 && (
              <div style={{ marginTop: 16 }}>
                <Text type="warning"><WarningOutlined /> {t('systemHealth.highLatency')}</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card 
            title={<span><DatabaseOutlined /> {t('systemHealth.services.redis')}</span>}
            extra={<Tag color={getStatusColor(health.services.redis.status)}>{health.services.redis.status}</Tag>}
          >
            <Statistic
              title={t('systemHealth.pingLatency')}
              value={health.services.redis.pingTimeMs}
              suffix={t('systemHealth.ms')}
              prefix={<ConsoleSqlOutlined />}
            />
            {health.services.redis.pingTimeMs > 50 && (
              <div style={{ marginTop: 16 }}>
                <Text type="warning"><WarningOutlined /> {t('systemHealth.highLatency')}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}