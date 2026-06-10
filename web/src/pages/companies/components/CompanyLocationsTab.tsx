import { Space, Button, List, Card, Typography, Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import { useServiceLocationsByCompany } from '@/hooks/use-service-locations';
import { useCompany } from '@/hooks/use-companies';
import type { ServiceLocation } from '@/types/models.types';
import { EyeOutlined, EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface CompanyLocationsTabProps {
  companyId: string;
}

export default function CompanyLocationsTab({ companyId }: CompanyLocationsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: locations, isLoading: isLocationsLoading } = useServiceLocationsByCompany(companyId);
  const { data: company, isLoading: isCompanyLoading } = useCompany(companyId);

  const isLoading = isLocationsLoading || isCompanyLoading;

  const hasPrimaryAddress = company && (
    company.billing_street || company.billing_city || company.billing_state || company.billing_zip_code || company.billing_address
  );

  return (
    <List
      grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
      loading={isLoading}
      locale={{ emptyText: 'No addresses found for this company' }}
    >
      {/* Primary Company Address Card */}
      {hasPrimaryAddress && (
        <List.Item>
          <Badge.Ribbon text="Billing Address" color="blue">
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: '#1890ff' }} />
                  Primary Company Address
                </Space>
              }
              size="small"
              actions={[
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/companies/${company.id}/edit`)}>Edit</Button>
              ]}
            >
              <Space direction="vertical" size={2}>
                {(company.billing_street || company.billing_address) && (
                  <Text>{company.billing_street || company.billing_address}</Text>
                )}
                {(company.billing_city || company.billing_state || company.billing_zip_code) && (
                  <Text>{[company.billing_city, company.billing_state, company.billing_zip_code].filter(Boolean).join(', ')}</Text>
                )}
                {company.billing_country && <Text type="secondary">{company.billing_country}</Text>}
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
