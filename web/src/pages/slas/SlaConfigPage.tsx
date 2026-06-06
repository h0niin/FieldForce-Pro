import React, { useState } from 'react';
import { Tabs, Card, Typography } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, AlertOutlined, PauseCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import SlaMatrixTab from './components/SlaMatrixTab';
import WorkingCalendarsTab from './components/WorkingCalendarsTab';
import EscalationsTab from './components/EscalationsTab';
import StatusPausesTab from './components/StatusPausesTab';
import SlaAnalyticsTab from './components/SlaAnalyticsTab';

const { Title, Text } = Typography;

export default function SlaConfigPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('matrix');

  return (
    <div>
      <PageHeader
        title="SLA Policies"
        subtitle="Manage Service Level Agreements, working hours, and escalations"
      />
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'matrix',
              label: (
                <span>
                  <ClockCircleOutlined />
                  SLA Matrix
                </span>
              ),
              children: <SlaMatrixTab />,
            },
            {
              key: 'calendars',
              label: (
                <span>
                  <CalendarOutlined />
                  Working Calendars
                </span>
              ),
              children: <WorkingCalendarsTab />,
            },
            {
              key: 'escalations',
              label: (
                <span>
                  <AlertOutlined />
                  Escalations & Alerts
                </span>
              ),
              children: <EscalationsTab />,
            },
            {
              key: 'pauses',
              label: (
                <span>
                  <PauseCircleOutlined />
                  Status Pauses
                </span>
              ),
              children: <StatusPausesTab />,
            },
            {
              key: 'analytics',
              label: (
                <span>
                  <LineChartOutlined />
                  Reporting Analytics
                </span>
              ),
              children: <SlaAnalyticsTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
