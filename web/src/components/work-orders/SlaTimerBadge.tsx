import React, { useEffect, useState } from 'react';
import { Progress, Tag, Typography, Tooltip, Space, theme } from 'antd';
import {
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import type { SlaTimerData } from '@/api/sla-timers.api';

const { Text } = Typography;
const { useToken } = theme;

interface SlaTimerBadgeProps {
  timer: SlaTimerData;
  compact?: boolean;
  label?: string;
}

export function SlaTimerBadge({ timer, compact = false, label = 'SLA Timer' }: SlaTimerBadgeProps) {
  const { token } = useToken();
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [percentUsed, setPercentUsed] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const started = new Date(timer.started_at).getTime();
      let totalPausedMs = timer.total_paused_ms;

      if (timer.paused_at) {
        totalPausedMs += now - new Date(timer.paused_at).getTime();
      }

      let elapsed;
      if (timer.completed_at && timer.actual_duration_ms !== null) {
        elapsed = timer.actual_duration_ms;
      } else {
        elapsed = now - started - totalPausedMs;
      }

      const remaining = Math.max(0, timer.sla_duration_ms - elapsed);
      const percent = Math.min(100, (elapsed / timer.sla_duration_ms) * 100);

      setElapsedMs(elapsed);
      setRemainingMs(remaining);
      setPercentUsed(percent);
    };

    calculateTime();

    if (timer.status === 'running' || timer.status === 'warning') {
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getStatusConfig = () => {
    switch (timer.status) {
      case 'completed_on_time':
        return { color: '#52c41a', icon: <CheckCircleOutlined />, label: 'Completed On Time' };
      case 'completed_late':
        return { color: '#ff4d4f', icon: <WarningOutlined />, label: 'Completed Late' };
      case 'breached':
        return { color: '#ff4d4f', icon: <WarningOutlined />, label: 'Breached' };
      case 'paused':
        return { color: '#faad14', icon: <PauseCircleOutlined />, label: 'Paused' };
      case 'warning':
        return { color: '#fa8c16', icon: <ClockCircleOutlined />, label: 'Warning' };
      default: // running
        return { color: '#1677ff', icon: <ClockCircleOutlined />, label: 'Running' };
    }
  };

  const getProgressColor = () => {
    if (timer.status === 'completed_on_time') return '#52c41a';
    if (timer.status === 'completed_late' || timer.status === 'breached') return '#ff4d4f';
    if (timer.status === 'paused') return '#faad14';
    
    if (percentUsed >= 90) return '#ff4d4f'; // Red
    if (percentUsed >= 75) return '#fa8c16'; // Orange
    if (percentUsed >= 50) return '#fadb14'; // Yellow
    return '#52c41a'; // Green
  };

  const config = getStatusConfig();
  const progressColor = getProgressColor();

  if (compact) {
    return (
      <Tooltip title={`${label} — ${config.label} — ${formatDuration(remainingMs)} remaining`}>
        <Tag color={config.color} icon={config.icon}>
          {label}: {formatDuration(remainingMs)}
        </Tag>
      </Tooltip>
    );
  }

  return (
    <div style={{
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: '8px',
      padding: '16px',
      background: token.colorBgContainer,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <Progress
        type="circle"
        percent={percentUsed}
        strokeColor={progressColor}
        size={64}
        format={() => (
          <div style={{ fontSize: '12px', color: progressColor }}>
            {Math.round(percentUsed)}%
          </div>
        )}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <Space>
            <FieldTimeOutlined style={{ color: config.color, fontSize: '18px' }} />
            <Text strong style={{ fontSize: '16px' }}>
              {label}
            </Text>
            <Tag color={config.color} style={{ margin: 0 }}>
              {config.label}
            </Tag>
          </Space>
          <Tooltip title={timer.source === 'historical_avg' ? `Calculated from average of last ${timer.sample_count} similar jobs` : 'Default fallback due to insufficient historical data'}>
            <Tag icon={<HistoryOutlined />} style={{ cursor: 'help' }}>
              {timer.source === 'historical_avg' ? 'Historical Avg' : 'Default'}
            </Tag>
          </Tooltip>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Time Remaining</Text>
            <Text strong style={{ fontSize: '16px', color: progressColor }}>
              {timer.status === 'completed_on_time' || timer.status === 'completed_late' 
                ? '—' 
                : formatDuration(remainingMs)}
            </Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Elapsed Time</Text>
            <Text strong>{formatDuration(elapsedMs)}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Allocated Time</Text>
            <Text strong>{formatDuration(timer.sla_duration_ms)}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
