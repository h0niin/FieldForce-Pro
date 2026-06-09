import { Table, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useServiceLocationsByContact } from '@/hooks/use-service-locations';
import type { ServiceLocation } from '@/types/models.types';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ContactLocationsTabProps {
  contactId: string;
}

export default function ContactLocationsTab({ contactId }: ContactLocationsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: locations, isLoading } = useServiceLocationsByContact(contactId);

  const columns: ColumnsType<ServiceLocation> = [
    {
      title: 'Location Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text || <span style={{ opacity: 0.5 }}>-</span>}</span>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address: string) => address || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (city: string) => city || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => state || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/service-locations/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/service-locations/${record.id}/edit`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={locations || []}
      rowKey="id"
      loading={isLoading}
      pagination={false}
      locale={{ emptyText: 'No service locations found for this contact' }}
    />
  );
}
