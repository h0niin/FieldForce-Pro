import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Tag,
  Statistic,
  Row,
  Col,
  Spin,
  Tooltip,
  Badge,
  Modal,
  Switch,
  InputNumber,
  Progress,
} from 'antd';
import {
  RobotOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useOptimizeSchedule, useOptimizationStatus } from '../../hooks/use-scheduling';
import { WorkOrderInput, TechnicianInput } from '../../api/scheduling.api';

const { Title, Text, Paragraph } = Typography;

interface AISchedulingSuggestionsProps {
  workOrders: WorkOrderInput[];
  technicians: TechnicianInput[];
  onOptimizationComplete?: (result: any) => void;
}

export const AISchedulingSuggestions: React.FC<AISchedulingSuggestionsProps> = ({
  workOrders,
  technicians,
  onOptimizationComplete,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [optimizationSettings, setOptimizationSettings] = useState({
    optimization_time_limit: 30,
    use_traffic_data: true,
    allow_overtime: false,
    buffer_percentage: 15,
  });
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const optimizeSchedule = useOptimizeSchedule();
  const { data: taskStatus } = useOptimizationStatus(currentTaskId, !!currentTaskId);

  const handleOptimize = async () => {
    if (!workOrders.length || !technicians.length) {
      return;
    }

    const result = await optimizeSchedule.mutateAsync({
      work_orders: workOrders,
      technicians: technicians,
      constraints: optimizationSettings,
    });

    // Check if it's a large optimization that runs in background
    if (result.data?.task_id) {
      setCurrentTaskId(result.data.task_id);
    } else {
      onOptimizationComplete?.(result.data);
    }
  };

  // Calculate optimization potential
  const calculateOptimizationPotential = () => {
    if (!workOrders.length) return 0;

    // Simulate calculation based on current schedule efficiency
    const totalJobs = workOrders.length;
    const techCount = technicians.length;
    const avgJobsPerTech = totalJobs / techCount;

    // If jobs are unevenly distributed or too many per tech, high potential
    if (avgJobsPerTech > 8) return 85;
    if (avgJobsPerTech > 6) return 60;
    return 30;
  };

  const optimizationPotential = calculateOptimizationPotential();

  return (
    <Card
      title={
        <Space>
          <RobotOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <Text strong>{t('aiScheduling.title')}</Text>
          <Badge
            count={optimizationPotential > 60 ? t('aiScheduling.highPotential') : optimizationPotential > 30 ? t('aiScheduling.medium') : t('aiScheduling.low')}
            style={{
              backgroundColor: optimizationPotential > 60 ? '#52c41a' : optimizationPotential > 30 ? '#faad14' : '#d9d9d9',
            }}
          />
        </Space>
      }
      extra={
        <Space>
          <Tooltip title={t('aiScheduling.settings')}>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(true)}
              size="small"
            />
          </Tooltip>
          <Button
            type={isExpanded ? 'default' : 'text'}
            onClick={() => setIsExpanded(!isExpanded)}
            size="small"
          >
            {isExpanded ? t('aiScheduling.collapse') : t('aiScheduling.expand')}
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Quick Stats */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={t('aiScheduling.jobsToSchedule')}
              value={workOrders.length}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('aiScheduling.availableTechnicians')}
              value={technicians.length}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('aiScheduling.optimizationPotential')}
              value={optimizationPotential}
              suffix="%"
              valueStyle={{ color: optimizationPotential > 60 ? '#3f8600' : undefined }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('aiScheduling.estTimeSavings')}
              value={Math.round((optimizationPotential / 100) * 45)}
              suffix={t('aiScheduling.minutes')}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
        </Row>

        {isExpanded && (
          <>
            {/* AI Insights */}
            <Alert
              message={t('aiScheduling.aiRecommendations')}
              description={
                <Space direction="vertical">
                  {optimizationPotential > 60 && (
                    <Text>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> {t('aiScheduling.highPotentialDetected')}
                    </Text>
                  )}
                  {workOrders.length > technicians.length * 8 && (
                    <Text>
                      <WarningOutlined style={{ color: '#faad14' }} /> {t('aiScheduling.workloadExceeds', { count: Math.ceil((workOrders.length - technicians.length * 8) / 8) })}
                    </Text>
                  )}
                  {optimizationSettings.use_traffic_data && (
                    <Text>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} /> {t('aiScheduling.trafficDataUsed')}
                    </Text>
                  )}
                </Space>
              }
              type={optimizationPotential > 60 ? 'success' : 'info'}
              showIcon
            />

            {/* Optimization Settings Preview */}
            <Space wrap>
              <Tag icon={<ClockCircleOutlined />}>
                {t('aiScheduling.timeLimit', { seconds: optimizationSettings.optimization_time_limit })}
              </Tag>
              <Tag icon={<ThunderboltOutlined />} color={optimizationSettings.use_traffic_data ? 'green' : 'default'}>
                {t('aiScheduling.traffic')}: {optimizationSettings.use_traffic_data ? t('aiScheduling.on') : t('aiScheduling.off')}
              </Tag>
              <Tag icon={<TeamOutlined />} color={optimizationSettings.allow_overtime ? 'orange' : 'default'}>
                {t('aiScheduling.overtime')}: {optimizationSettings.allow_overtime ? t('aiScheduling.allowed') : t('aiScheduling.normalHours')}
              </Tag>
              <Tag icon={<InfoCircleOutlined />}>
                {t('aiScheduling.buffer', { percent: optimizationSettings.buffer_percentage })}
              </Tag>
            </Space>

            {/* Progress indicator for background optimization */}
            {currentTaskId && taskStatus && (
              <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t('aiScheduling.optimizationInProgress')}</Text>
                  <Progress
                    percent={taskStatus.progress || 0}
                    status={taskStatus.status === 'completed' ? 'success' : 'active'}
                  />
                  {taskStatus.status === 'completed' && (
                    <Alert
                      message={t('aiScheduling.optimizationComplete')}
                      description={t('aiScheduling.optimizedJobs', { count: taskStatus.result?.assigned_jobs || 0 })}
                      type="success"
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            )}
          </>
        )}

        {/* Action Buttons */}
        <Space>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            onClick={handleOptimize}
            loading={optimizeSchedule.isPending || !!currentTaskId}
            disabled={!workOrders.length || !technicians.length}
            size="large"
          >
            {t('aiScheduling.optimizeWithAi')}
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={() => window.location.reload()}
          >
            {t('aiScheduling.refreshData')}
          </Button>
        </Space>
      </Space>

      {/* Settings Modal */}
      <Modal
        title={t('aiScheduling.settingsTitle')}
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        onOk={() => setShowSettings(false)}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>{t('aiScheduling.timeLimitSeconds')}</Text>
            <InputNumber
              min={5}
              max={300}
              value={optimizationSettings.optimization_time_limit}
              onChange={(value) =>
                setOptimizationSettings((prev) => ({
                  ...prev,
                  optimization_time_limit: value || 30,
                }))
              }
              style={{ width: '100%', marginTop: 8 }}
            />
            <Text type="secondary">
              {t('aiScheduling.timeLimitHelper')}
            </Text>
          </div>

          <div>
            <Space>
              <Text strong>{t('aiScheduling.useTrafficData')}</Text>
              <Switch
                checked={optimizationSettings.use_traffic_data}
                onChange={(checked) =>
                  setOptimizationSettings((prev) => ({
                    ...prev,
                    use_traffic_data: checked,
                  }))
                }
              />
            </Space>
            <br />
            <Text type="secondary">
              {t('aiScheduling.trafficDataHelper')}
            </Text>
          </div>

          <div>
            <Space>
              <Text strong>{t('aiScheduling.allowOvertime')}</Text>
              <Switch
                checked={optimizationSettings.allow_overtime}
                onChange={(checked) =>
                  setOptimizationSettings((prev) => ({
                    ...prev,
                    allow_overtime: checked,
                  }))
                }
              />
            </Space>
            <br />
            <Text type="secondary">
              {t('aiScheduling.allowOvertimeHelper')}
            </Text>
          </div>

          <div>
            <Text strong>{t('aiScheduling.bufferPercentage')}</Text>
            <InputNumber
              min={0}
              max={50}
              value={optimizationSettings.buffer_percentage}
              onChange={(value) =>
                setOptimizationSettings((prev) => ({
                  ...prev,
                  buffer_percentage: value || 15,
                }))
              }
              style={{ width: '100%', marginTop: 8 }}
            />
            <Text type="secondary">
              {t('aiScheduling.bufferHelper')}
            </Text>
          </div>
        </Space>
      </Modal>
    </Card>
  );
};