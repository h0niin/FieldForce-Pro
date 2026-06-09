import { useState } from 'react';
import { Typography, Input, Table, Button, Progress, Divider } from 'antd';
import { SearchOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TOTAL_GB = 10;

export default function FileStoragePage() {
  const [search, setSearch] = useState('');

  // Static module list – no real backend storage API yet; shows 0 usage as per the reference
  const modules = [
    'Service Requests',
    'Work Orders',
    'Estimates',
    'Invoices',
    'Contacts',
    'Companies',
    'Assets',
    'Job Sheets',
  ].filter((m) => m.toLowerCase().includes(search.toLowerCase()));

  const dataSource = modules.map((name) => ({ key: name, name, storage: '0 MB' }));

  const usedGB = 0;
  const usedPercent = Math.round((usedGB / TOTAL_GB) * 100);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Title level={4} style={{ marginTop: 0 }}>
        File Storage
      </Title>
      <Text type="secondary">
        Displaying the total File storage space used by the organisation. File storage includes
        attachments to Notes and Compressed Images in service reports.
        <br />
        Note: Storage usage shown below is not real-time and can have some delay in displaying
        updated details.
      </Text>

      {/* Storage gauge */}
      <div
        style={{
          marginTop: 24,
          padding: '20px 24px',
          border: '1px solid #f0f0f0',
          borderRadius: 8,
          display: 'inline-block',
          minWidth: 360,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{usedGB.toFixed(2)} GB Used</span>
            {' '}
            of {TOTAL_GB}.00 GB{' '}
            <InfoCircleOutlined style={{ color: '#aaa', marginLeft: 4 }} />
          </Text>
          <Button type="link" icon={<PlusOutlined />} style={{ color: '#2e8b57', fontWeight: 500, padding: 0 }}>
            Add Storage
          </Button>
        </div>
        <Progress
          percent={usedPercent}
          showInfo={false}
          strokeColor="#2e8b57"
          trailColor="#e8e8e8"
          style={{ marginBottom: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>0 gb</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{TOTAL_GB} gb</Text>
        </div>
      </div>

      <Divider />

      {/* Per-module breakdown */}
      <Input
        placeholder="Search"
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        style={{ width: 240, marginBottom: 16 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table
        dataSource={dataSource}
        pagination={false}
        locale={{ emptyText: 'No Records Found' }}
        columns={[
          { title: 'Module Name', dataIndex: 'name', key: 'name' },
          { title: 'Storage', dataIndex: 'storage', key: 'storage', align: 'right' as const },
        ]}
        size="middle"
      />
    </div>
  );
}
