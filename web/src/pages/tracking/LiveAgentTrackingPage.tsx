import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Space,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Select,
  Alert,
  Badge,
  Tooltip,
  Typography,
  Empty,
  Progress,
  Divider,
} from 'antd';
import {
  EnvironmentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CarOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  DashboardOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next'; // Rule 1: Import useTranslation
import { useAllAppointments } from '@/hooks/use-appointments';
import { useUsers } from '@/hooks/use-users';
import PageHeader from '@/components/common/PageHeader';
import { formatDateTime, formatRelative } from '@/utils/format-date';

const { Text, Title } = Typography;

interface AgentStatus {
  id: string;
  name: string;
  status: 'available' | 'on_route' | 'on_site' | 'offline';
  currentLocation?: { lat: number; lng: number; address: string };
  currentAppointment?: {
    id: string;
    wo_number: string;
    customer: string;
    eta: string;
  };
  todayStats: {
    completed: number;
    pending: number;
    distance: number;
  };
  lastUpdate: string;
  batteryLevel?: number;
}

const statusColors: Record<string, string> = {
  available: '#52c41a',
  on_route: '#1890ff',
  on_site: '#faad14',
  offline: '#d9d9d9',
};

export default function LiveAgentTrackingPage() {
  const { t } = useTranslation(); // Rule 2: Declare t()
  const navigate = useNavigate();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useAllAppointments();
  const { data: usersData, isLoading: usersLoading } = useUsers({ page: 1, take: 100 });

  const users = usersData?.data || [];

  // Rule 5: Move and translate statusLabels inside the component
  const statusLabels: Record<string, string> = {
    available: t('liveAgentTracking.status.available'),
    on_route: t('liveAgentTracking.status.enRoute'),
    on_site: t('liveAgentTracking.status.onSite'),
    offline: t('liveAgentTracking.status.offline'),
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchAppointments();
      setLastRefresh(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetchAppointments]);

  // Mock agent status data (in production, this would come from real-time GPS data)
  const agentStatuses: AgentStatus[] = users.map((user, index) => {
    const activeAppointment = appointments.find(
      (apt) => apt.agent_id === user.id && apt.status === 'in_progress'
    );

    const todayAppointments = appointments.filter((apt) => apt.agent_id === user.id);
    const completedToday = todayAppointments.filter((apt) => apt.status === 'completed').length;
    const pendingToday = todayAppointments.filter((apt) => apt.status === 'scheduled').length;

    let status: AgentStatus['status'] = 'available';
    if (activeAppointment) {
      status = 'on_site';
    } else if (index % 5 === 0) {
      status = 'offline';
    }

    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      status,
      currentLocation: {
        lat: 37.7749 + (Math.random() - 0.5) * 0.1,
        lng: -122.4194 + (Math.random() - 0.5) * 0.1,
        address: `${Math.floor(Math.random() * 9999)} Market St, San Francisco, CA`,
      },
      currentAppointment: activeAppointment
        ? {
            id: activeAppointment.id,
            wo_number: activeAppointment.work_order?.wo_number || 'N/A',
            customer: 'Customer Name', // This could be dynamic, leaving as is for now as per rules
            eta: formatDateTime(activeAppointment.scheduled_start),
          }
        : undefined,
      todayStats: {
        completed: completedToday,
        pending: pendingToday,
        distance: Math.floor(Math.random() * 100) + 20,
      },
      lastUpdate: new Date().toISOString(),
      batteryLevel: Math.floor(Math.random() * 40) + 60,
    };
  });

  // Filter agents
  const filteredAgents = agentStatuses.filter((agent) => {
    if (selectedAgent && agent.id !== selectedAgent) return false;
    if (selectedStatus && agent.status !== selectedStatus) return false;
    return true;
  });

  // Calculate statistics
  const totalAgents = agentStatuses.length;
  const activeAgents = agentStatuses.filter((a) => a.status !== 'offline').length;
  const onRoute = agentStatuses.filter((a) => a.status === 'on_route').length;
  const onSite = agentStatuses.filter((a) => a.status === 'on_site').length;
  const totalCompletedToday = agentStatuses.reduce((sum, a) => sum + a.todayStats.completed, 0);
  const totalDistance = agentStatuses.reduce((sum, a) => sum + a.todayStats.distance, 0);

  return (
    <div>
      <PageHeader
        title={t('liveAgentTracking.pageHeader.title')}
        subtitle={t('liveAgentTracking.pageHeader.subtitle')}
        extra={
          <Space>
            <Button
              icon={<ThunderboltOutlined />}
              type="primary"
              ghost
            >
              {t('liveAgentTracking.buttons.aiRouteOptimization')}
            </Button>
            <Button
              icon={<ReloadOutlined spin={autoRefresh} />}
              onClick={() => {
                refetchAppointments();
                setLastRefresh(new Date());
              }}
              loading={appointmentsLoading}
            >
              {t('liveAgentTracking.buttons.refresh')}
            </Button>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? t('liveAgentTracking.buttons.autoRefreshOn') : t('liveAgentTracking.buttons.autoRefreshOff')}
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('liveAgentTracking.statistics.activeAgents')}
              value={activeAgents}
              suffix={`/ ${totalAgents}`}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('liveAgentTracking.statistics.enRoute')}
              value={onRoute}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('liveAgentTracking.statistics.onSite')}
              value={onSite}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('liveAgentTracking.statistics.completedToday')}
              value={totalCompletedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* AI Optimization Alert */}
      <Alert
        message={
          <Space>
            <ThunderboltOutlined />
            <Text strong>{t('liveAgentTracking.aiAlert.message')}</Text>
          </Space>
        }
        description={t('liveAgentTracking.aiAlert.description')}
        type="info"
        showIcon
        icon={<RocketOutlined />}
        action={
          <Button size="small" type="primary">
            {t('liveAgentTracking.aiAlert.applySuggestion')}
          </Button>
        }
        closable
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        {/* Map Section */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined />
                <span>{t('liveAgentTracking.mapSection.cardTitle')}</span>
                <Badge count={activeAgents} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('liveAgentTracking.mapSection.lastUpdated')} {formatRelative(lastRefresh)}
                </Text>
                <SyncOutlined spin={autoRefresh} style={{ color: autoRefresh ? '#52c41a' : '#999' }} />
              </Space>
            }
          >
            <Alert
              message={t('liveAgentTracking.mapSection.alertMessage')}
              description={
                <div>
                  <p>
                    {t('liveAgentTracking.mapSection.alertDescriptionP1')}
                  </p>
                  <ul style={{ marginTop: 8 }}>
                    <li>{t('liveAgentTracking.mapSection.features.realtimeLocation')}</li>
                    <li>{t('liveAgentTracking.mapSection.features.currentRoute')}</li>
                    <li>{t('liveAgentTracking.mapSection.features.trafficOverlay')}</li>
                    <li>{t('liveAgentTracking.mapSection.features.geofencing')}</li>
                    <li>{t('liveAgentTracking.mapSection.features.heatMap')}</li>
                    <li>{t('liveAgentTracking.mapSection.features.clickAgents')}</li>
                    <li>{t('liveAgentTracking.mapSection.features.autoCenter')}</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <div
              style={{
                border: '2px dashed #d9d9d9',
                borderRadius: 8,
                height: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <EnvironmentOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
              <Title level={4} style={{ color: '#999', margin: 0 }}>
                {t('liveAgentTracking.mapSection.mapPlaceholderTitle')}
              </Title>
              <Text type="secondary">
                {t('liveAgentTracking.mapSection.agentsTracked', { count: activeAgents })}
              </Text>
              <Space wrap style={{ marginTop: 12 }}>
                <Tag color={statusColors.available}>
                  <Badge color={statusColors.available} /> {t('liveAgentTracking.status.available')}
                </Tag>
                <Tag color={statusColors.on_route}>
                  <Badge color={statusColors.on_route} /> {t('liveAgentTracking.status.enRoute')}
                </Tag>
                <Tag color={statusColors.on_site}>
                  <Badge color={statusColors.on_site} /> {t('liveAgentTracking.status.onSite')}
                </Tag>
                <Tag color={statusColors.offline}>
                  <Badge color={statusColors.offline} /> {t('liveAgentTracking.status.offline')}
                </Tag>
              </Space>
            </div>
          </Card>

          {/* AI Insights */}
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
                <span>{t('liveAgentTracking.aiInsights.cardTitle')}</span>
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t('liveAgentTracking.aiInsights.routeEfficiencyTitle')}</Text>
                    <Progress percent={87} strokeColor="#1890ff" />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('liveAgentTracking.aiInsights.routeEfficiencyDescription')}
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t('liveAgentTracking.aiInsights.performanceTitle')}</Text>
                    <Progress percent={92} strokeColor="#52c41a" />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('liveAgentTracking.aiInsights.performanceDescription')}
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ padding: 12, background: '#fff7e6', borderRadius: 6 }}>
                <Space>
                  <WarningOutlined style={{ color: '#fa8c16' }} />
                  <Text strong>{t('liveAgentTracking.aiInsights.trafficAlertTitle')}</Text>
                </Space>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('liveAgentTracking.aiInsights.trafficAlertDescription')}
                </Text>
              </div>
              <div style={{ padding: 12, background: '#f0f5ff', borderRadius: 6 }}>
                <Space>
                  <RocketOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{t('liveAgentTracking.aiInsights.optimizationOpportunityTitle')}</Text>
                </Space>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('liveAgentTracking.aiInsights.optimizationOpportunityDescription')}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Agent List Section */}
        <Col xs={24} lg={8}>
          <Card
            title={t('liveAgentTracking.agentList.cardTitle')}
            size="small"
            extra={
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  placeholder={t('liveAgentTracking.agentList.filterByAgentPlaceholder')}
                  allowClear
                  value={selectedAgent}
                  onChange={setSelectedAgent}
                  style={{ width: '100%' }}
                  loading={usersLoading}
                  options={users.map((user) => ({
                    value: user.id,
                    label: `${user.first_name} ${user.last_name}`,
                  }))}
                />
                <Select
                  placeholder={t('liveAgentTracking.agentList.filterByStatusPlaceholder')}
                  allowClear
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'available', label: t('liveAgentTracking.status.available') },
                    { value: 'on_route', label: t('liveAgentTracking.status.enRoute') },
                    { value: 'on_site', label: t('liveAgentTracking.status.onSite') },
                    { value: 'offline', label: t('liveAgentTracking.status.offline') },
                  ]}
                />
              </Space>
            }
            style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
          >
            {filteredAgents.length === 0 ? (
              <Empty description={t('liveAgentTracking.agentList.emptyAgents')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={filteredAgents}
                renderItem={(agent) => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <Badge dot color={statusColors[agent.status]} offset={[-5, 35]}>
                          <Avatar
                            size={48}
                            style={{
                              backgroundColor: statusColors[agent.status],
                            }}
                          >
                            {agent.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </Avatar>
                        </Badge>
                      }
                      title={
                        <Space>
                          <Text strong>{agent.name}</Text>
                          <Tag color={statusColors[agent.status]} style={{ margin: 0 }}>
                            {statusLabels[agent.status]}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          {agent.currentAppointment && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {t('liveAgentTracking.agentList.currentAppointmentLabel')} {agent.currentAppointment.wo_number}
                              </Text>
                            </div>
                          )}
                          <Space size="small" wrap>
                            <Tooltip title={t('liveAgentTracking.agentList.tooltip.completedToday')}>
                              <Tag icon={<CheckCircleOutlined />} color="success">
                                {agent.todayStats.completed}
                              </Tag>
                            </Tooltip>
                            <Tooltip title={t('liveAgentTracking.agentList.tooltip.pending')}>
                              <Tag icon={<ClockCircleOutlined />} color="processing">
                                {agent.todayStats.pending}
                              </Tag>
                            </Tooltip>
                            <Tooltip title={t('liveAgentTracking.agentList.tooltip.distanceToday')}>
                              <Tag icon={<DashboardOutlined />} color="default">
                                {agent.todayStats.distance} km
                              </Tag>
                            </Tooltip>
                          </Space>
                          {agent.batteryLevel && agent.batteryLevel < 20 && (
                            <Alert
                              message={t('liveAgentTracking.agentList.lowBatteryAlert')}
                              type="warning"
                              showIcon
                              style={{ padding: '4px 8px', fontSize: 11 }}
                            />
                          )}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined /> {formatRelative(new Date(agent.lastUpdate))}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}