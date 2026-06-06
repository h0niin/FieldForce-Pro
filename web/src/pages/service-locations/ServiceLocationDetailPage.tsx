import { useNavigate, useParams } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Spin, Tag, Empty, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '@/components/common/PageHeader';
import { useServiceLocation, useDeleteServiceLocation } from '@/hooks/use-service-locations';
import { formatDateTime } from '@/utils/format-date';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ServiceLocationDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: location, isLoading } = useServiceLocation(id || '');
  const deleteServiceLocation = useDeleteServiceLocation();

  const handleDelete = () => {
    if (!location) return;

    showConfirmDialog({
      title: t('serviceLocationDetail.deleteTitle'),
      content: t('serviceLocationDetail.deleteContent', { address: location.address }),
      onOk: async () => {
        await deleteServiceLocation.mutateAsync(location.id);
        navigate('/service-locations');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!location) {
    return (
      <div style={{ padding: 100 }}>
        <Empty description={t('serviceLocationDetail.notFound')} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => navigate('/service-locations')}>
            {t('serviceLocationDetail.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('serviceLocationDetail.title')}
        subtitle={t('serviceLocationDetail.subtitle', { address: location.address })}
        onBack={() => navigate('/service-locations')}
        extra={
          <Space>
            <PermissionGuard permission="service_locations:update">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/service-locations/${id}/edit`)}
              >
                {t('serviceLocationDetail.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="service_locations:delete">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                {t('serviceLocationDetail.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title={t('serviceLocationDetail.locationInformation')} style={{ marginBottom: 24 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={t('serviceLocationDetail.address')} span={2}>
                <Space>
                  <EnvironmentOutlined />
                  {location.address}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label={t('serviceLocationDetail.accessNotes')}>
                {location.access_notes || <span style={{ color: '#999' }}>{t('serviceLocationDetail.notSpecified')}</span>}
              </Descriptions.Item>

              <Descriptions.Item label={t('serviceLocationDetail.gateCode')}>
                {location.gate_code ? (
                  <Tag color="green">{location.gate_code}</Tag>
                ) : (
                  <span style={{ color: '#999' }}>{t('serviceLocationDetail.notSpecified')}</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('serviceLocationDetail.latitude')}>
                {location.lat ? Number(location.lat).toFixed(6) : <span style={{ color: '#999' }}>{t('serviceLocationDetail.notSet')}</span>}
              </Descriptions.Item>

              <Descriptions.Item label={t('serviceLocationDetail.longitude')}>
                {location.lng ? Number(location.lng).toFixed(6) : <span style={{ color: '#999' }}>{t('serviceLocationDetail.notSet')}</span>}
              </Descriptions.Item>

              <Descriptions.Item label={t('serviceLocationDetail.createdAt')}>
                {formatDateTime(location.created_at)}
              </Descriptions.Item>

              <Descriptions.Item label={t('serviceLocationDetail.updatedAt')}>
                {formatDateTime(location.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t('serviceLocationDetail.mapView')} style={{ marginBottom: 24 }}>
            {location.lat && location.lng ? (
              <div>
                <div style={{ height: 250, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                  <MapContainer
                    center={[Number(location.lat), Number(location.lng)]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[Number(location.lat), Number(location.lng)]}>
                      <Popup>{location.address}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <Button
                  type="primary"
                  icon={<GlobalOutlined />}
                  block
                  onClick={() => window.open(`https://maps.google.com/?q=${location.lat},${location.lng}`, '_blank')}
                >
                  {t('serviceLocationDetail.viewOnGoogleMaps')}
                </Button>
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('serviceLocationDetail.noCoordinatesSet')}
              />
            )}
          </Card>

          {location.custom_fields && Object.keys(location.custom_fields).length > 0 && (
            <Card title={t('serviceLocationDetail.customFields')}>
              <Descriptions column={1} size="small">
                {Object.entries(location.custom_fields).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}