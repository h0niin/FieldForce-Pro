import { Tag } from 'antd';
import { STATUS_COLORS } from '@/utils/constants';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status.toLowerCase()] || 'default';

  return (
    <Tag color={color}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Tag>
  );
}
