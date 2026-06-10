import { Space, Button, List, Card, Typography, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import { useServiceLocationsByContact } from '@/hooks/use-service-locations';
import { useContact } from '@/hooks/use-contacts';
import type { ServiceLocation } from '@/types/models.types';
import { EyeOutlined, EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface ContactLocationsTabProps {
  contactId: string;
}

export default function ContactLocationsTab({ contactId }: ContactLocationsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: locations, isLoading: isLocationsLoading } = useServiceLocationsByContact(contactId);
  const { data: contact, isLoading: isContactLoading } = useContact(contactId);

  const isLoading = isLocationsLoading || isContactLoading;

  return (
    <List
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
      loading={isLoading}
      locale={{ emptyText: 'No addresses found for this contact' }}
    >
      {/* Primary Contact Address Card */}
      {contact && (contact.service_address || contact.billing_address) && (
        <List.Item>
          <Badge.Ribbon text="Primary Address" color="blue">
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: '#1890ff' }} />
                  Contact Addresses
                </Space>
              }
              size="small"
              actions={[
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/contacts/${contact.id}/edit`)}>Edit</Button>
              ]}
            >
              <Space direction="vertical" size={2}>
                {contact.service_address && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Service: </Text>
                    <Text>{contact.service_address}</Text>
                  </div>
                )}
                {contact.billing_address && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Billing: </Text>
                    <Text>{contact.billing_address}</Text>
                  </div>
                )}
              </Space>
            </Card>
          </Badge.Ribbon>
        </List.Item>
      )}

      {/* Service Locations Cards */}
      {locations?.map((location: ServiceLocation) => (
        <List.Item key={location.id}>
          <Badge.Ribbon text="Service Location" color="green">
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: '#52c41a' }} />
                  {location.name || 'Service Location'}
                </Space>
              }
              size="small"
              actions={[
                <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/service-locations/${location.id}`)}>View</Button>,
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/service-locations/${location.id}/edit`)}>Edit</Button>
              ]}
            >
              <Space direction="vertical" size={2}>
                <Text>{location.address}</Text>
                {(location.city || location.state || location.zip_code) && (
                  <Text>{[location.city, location.state, location.zip_code].filter(Boolean).join(', ')}</Text>
                )}
                {location.country && <Text type="secondary">{location.country}</Text>}
                
                {(location.gate_code || location.access_notes) && (
                  <div style={{ marginTop: 8 }}>
                    {location.gate_code && <div><Text type="secondary" style={{ fontSize: '12px' }}>Gate Code: </Text><Text style={{ fontSize: '12px' }}>{location.gate_code}</Text></div>}
                    {location.access_notes && <div><Text type="secondary" style={{ fontSize: '12px' }}>Notes: </Text><Text style={{ fontSize: '12px' }}>{location.access_notes}</Text></div>}
                  </div>
                )}
              </Space>
            </Card>
          </Badge.Ribbon>
        </List.Item>
      ))}
    </List>
  );
}
