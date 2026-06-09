import { Card, Timeline, Skeleton, Empty, Typography } from 'antd';
import { useActivityLogs } from '@/hooks/use-activity-logs';
import { formatDateTime } from '@/utils/format-date';
import { formatEnumText } from '@/utils/string';

const { Text } = Typography;

interface EntityTimelineTabProps {
  entityType: string;
  entityId: string;
}

export function EntityTimelineTab({ entityType, entityId }: EntityTimelineTabProps) {
  const { data: logs, isLoading } = useActivityLogs(entityType, entityId);

  if (isLoading) {
    return (
      <Card title="Timeline">
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card title="Timeline">
        <Empty description="No activity logged for this record yet." />
      </Card>
    );
  }

  return (
    <Card title="Timeline">
      <Timeline
        mode="left"
        items={logs.map((log) => {
          let color = 'blue';
          if (log.action === 'CREATED') color = 'green';
          if (log.action === 'DELETED') color = 'red';
          
          return {
            color,
            children: (
              <>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                  {formatDateTime(log.created_at)}
                </Text>
                <Text strong>{formatEnumText(log.action)}</Text>
                <br />
                <Text>{log.description}</Text>
              </>
            ),
          };
        })}
      />
    </Card>
  );
}
