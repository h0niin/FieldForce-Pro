import { useState } from 'react';
import {
  Card,
  Button,
  DatePicker,
  Select,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  Divider,
  Alert,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAutoAssign } from '@/hooks/use-scheduling';
import type { AutoAssignCandidate } from '@/api/scheduling.api';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

interface AutoAssignPanelProps {
  workOrderId?: string;
  onAssigned?: (agentId: string, agentName: string) => void;
}

export default function AutoAssignPanel({ workOrderId, onAssigned }: AutoAssignPanelProps) {
  const { t } = useTranslation();
  const [woId, setWoId] = useState(workOrderId || '');
  const [startTime, setStartTime] = useState<dayjs.Dayjs | null>(null);
  const [endTime, setEndTime] = useState<dayjs.Dayjs | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [territory, setTerritory] = useState('');

  const autoAssign = useAutoAssign();
  const result = autoAssign.data?.data;

  const handleAutoAssign = () => {
    if (!woId || !startTime || !endTime) return;
    autoAssign.mutate({
      work_order_id: woId,
      scheduled_start: startTime.toISOString(),
      scheduled_end: endTime.toISOString(),
      required_skills: skills.length > 0 ? skills : undefined,
      territory: territory || undefined,
    });
  };

  const handleSelectCandidate = (candidate: AutoAssignCandidate) => {
    if (onAssigned) {
      onAssigned(candidate.agent_id, candidate.agent_name);
    }
  };

  const candidateColumns: ColumnsType<AutoAssignCandidate> = [
    {
      title: t('autoAssign.technician'),
      dataIndex: 'agent_name',
      key: 'agent_name',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: t('autoAssign.available'),
      dataIndex: 'available',
      key: 'available',
      width: 100,
      render: (available: boolean) =>
        available ? (
          <Tag icon={<CheckCircleOutlined />} color="success">{t('autoAssign.yes')}</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">{t('autoAssign.no')}</Tag>
        ),
    },
    {
      title: t('autoAssign.score'),
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => (
        <Tag color={score >= 50 ? 'green' : score >= 30 ? 'gold' : 'red'}>{score}</Tag>
      ),
      sorter: (a, b) => a.score - b.score,
      defaultSortOrder: 'descend',
    },
    {
      title: t('autoAssign.details'),
      dataIndex: 'reasons',
      key: 'reasons',
      render: (reasons: string[]) => (
        <Space direction="vertical" size={0}>
          {reasons.map((r, i) => (
            <Text key={i} type="secondary" style={{ fontSize: 12 }}>{r}</Text>
          ))}
        </Space>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 100,
      render: (_, record) =>
        record.available ? (
          <Button size="small" type="primary" onClick={() => handleSelectCandidate(record)}>
            {t('autoAssign.assign')}
          </Button>
        ) : null,
    },
  ];

  const skillOptions = [
    { value: 'hvac', label: t('autoAssign.skills.hvac') },
    { value: 'plumbing', label: t('autoAssign.skills.plumbing') },
    { value: 'electrical', label: t('autoAssign.skills.electrical') },
    { value: 'appliance', label: t('autoAssign.skills.appliance') },
    { value: 'general', label: t('autoAssign.skills.general') },
  ];

  const territoryOptions = [
    { value: 'north', label: t('autoAssign.territories.north') },
    { value: 'south', label: t('autoAssign.territories.south') },
    { value: 'east', label: t('autoAssign.territories.east') },
    { value: 'west', label: t('autoAssign.territories.west') },
    { value: 'central', label: t('autoAssign.territories.central') },
  ];

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          <span>{t('autoAssign.title')}</span>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {!workOrderId && (
          <Input
            placeholder={t('autoAssign.workOrderId')}
            value={woId}
            onChange={(e) => setWoId(e.target.value)}
          />
        )}

        <Space wrap>
          <DatePicker
            showTime
            placeholder={t('autoAssign.scheduledStart')}
            value={startTime}
            onChange={setStartTime}
            style={{ width: 200 }}
          />
          <DatePicker
            showTime
            placeholder={t('autoAssign.scheduledEnd')}
            value={endTime}
            onChange={setEndTime}
            style={{ width: 200 }}
          />
        </Space>

        <Space wrap>
          <Select
            mode="multiple"
            placeholder={t('autoAssign.requiredSkills')}
            options={skillOptions}
            value={skills}
            onChange={setSkills}
            style={{ minWidth: 200 }}
            allowClear
          />
          <Select
            placeholder={t('autoAssign.territory')}
            options={territoryOptions}
            value={territory || undefined}
            onChange={(v) => setTerritory(v || '')}
            style={{ width: 150 }}
            allowClear
          />
        </Space>

        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={autoAssign.isPending}
          disabled={!woId || !startTime || !endTime}
          onClick={handleAutoAssign}
        >
          {t('autoAssign.findBestTechnician')}
        </Button>

        {autoAssign.isPending && <Spin tip={t('autoAssign.evaluatingCandidates')} />}

        {result && (
          <>
            <Divider style={{ margin: '8px 0' }} />

            {result.assigned ? (
              <Alert
                type="success"
                message={t('autoAssign.recommended', { name: result.agent_name })}
                description={t('autoAssign.matchDescription', { score: result.score })}
                showIcon
              />
            ) : (
              <Alert
                type="warning"
                message={t('autoAssign.noTechnicianFound')}
                description={t('autoAssign.noTechnicianDescription')}
                showIcon
              />
            )}

            {result.candidates.length > 0 && (
              <>
                <Title level={5} style={{ marginTop: 8, marginBottom: 4 }}>
                  {t('autoAssign.allCandidates', { count: result.candidates.length })}
                </Title>
                <Table
                  columns={candidateColumns}
                  dataSource={result.candidates}
                  rowKey="agent_id"
                  size="small"
                  pagination={false}
                  rowClassName={(record) =>
                    result.agent_id === record.agent_id ? 'ant-table-row-selected' : ''
                  }
                />
              </>
            )}
          </>
        )}
      </Space>
    </Card>
  );
}