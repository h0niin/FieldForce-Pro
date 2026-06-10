import { Typography } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function ServiceReportsPage() {
  return (
    <div style={{ padding: 32, textAlign: 'center', marginTop: 80 }}>
      <FileDoneOutlined style={{ fontSize: 64, color: '#2563eb', marginBottom: 24 }} />
      <Title level={2}>Service Reports</Title>
      <Text type="secondary" style={{ fontSize: 16 }}>Coming soon</Text>
    </div>
  );
}
