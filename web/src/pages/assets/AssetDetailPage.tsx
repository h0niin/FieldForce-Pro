import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next'; // Rule 1: Import useTranslation
import { useAsset, useDeleteAsset } from '@/hooks/use-assets';
import { useAssetMaintenancePlans } from '@/hooks/use-maintenance-plans';
import type { AssetMaintenancePlan } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Rule 2: Declare t
  const { data: asset, isLoading } = useAsset(id!);
  const { data: maintenancePlans, isLoading: plansLoading } = useAssetMaintenancePlans(id!);
  const deleteAsset = useDeleteAsset();

  const handleDelete = () => {
    if (!asset) return;
    showConfirmDialog({
      title: t('assetDetailPage.deleteAssetTitle'), // Rule 5
      content: t('assetDetailPage.deleteConfirmContent', { assetName: asset.name }), // Rule 5
      onOk: async () => {
        await deleteAsset.mutateAsync(asset.id);
        navigate('/assets');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('assetDetailPage.assetDetailsTitle')} /> {/* Rule 4 */}
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!asset) {
    return (
      <div>
        <PageHeader title={t('assetDetailPage.assetNotFoundTitle')} /> {/* Rule 4 */}
        <Card>{t('assetDetailPage.assetNotFoundMessage')}</Card> {/* Rule 3 */}
      </div>
    );
  }

  const warrantyExpiry = asset.warranty_expiry ? new Date(asset.warranty_expiry) : null;
  const isWarrantyActive = warrantyExpiry ? warrantyExpiry > new Date() : false;

  const planColumns: ColumnsType<AssetMaintenancePlan> = [
    { title: t('assetDetailPage.planNameColumn'), dataIndex: 'name', key: 'name' }, // Rule 5
    { title: t('assetDetailPage.frequencyColumn'), dataIndex: 'frequency', key: 'frequency', render: (f: string) => <Tag>{f}</Tag> }, // Rule 5
    { title: t('assetDetailPage.nextDueColumn'), dataIndex: 'next_due_date', key: 'next_due_date', render: (d: string) => d || '-' }, // Rule 5
    {
      title: t('assetDetailPage.autoWOColumn'), // Rule 5
      dataIndex: 'auto_create_wo',
      key: 'auto_create_wo',
      render: (v: boolean) => v ? <Tag color="green">{t('common.yes')}</Tag> : <Tag>{t('common.no')}</Tag> // Rule 3
    },
    {
      title: t('assetDetailPage.activeColumn'), // Rule 5
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => v ? <Tag color="green">{t('common.active')}</Tag> : <Tag color="red">{t('common.inactive')}</Tag> // Rule 3
    },
  ];

  return (
    <div>
      <PageHeader
        title={asset.name}
        onBack={() => navigate('/assets')}
        extra={
          <Space>
            <PermissionGuard permission="assets:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/assets/${asset.id}/edit`)}>{t('common.edit')}</Button> {/* Rule 3 */}
            </PermissionGuard>
            <PermissionGuard permission="assets:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>{t('common.delete')}</Button> {/* Rule 3 */}
            </PermissionGuard>
          </Space>
        }
      />

      <Card title={t('assetDetailPage.assetInformationCardTitle')}> {/* Rule 4 */}
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('assetDetailPage.assetNameLabel')} span={2}>{asset.name}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('assetDetailPage.modelLabel')}>{asset.model || <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('assetDetailPage.serialNumberLabel')}>{asset.serial_number || <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('assetDetailPage.manufacturerLabel')}>{asset.manufacturer || <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('assetDetailPage.categoryLabel')}>{asset.category ? <Tag>{asset.category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('assetDetailPage.installDateLabel')}>{asset.install_date || <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('assetDetailPage.warrantyExpiryLabel')}> {/* Rule 4 */}
            {asset.warranty_expiry ? (
              <Space>
                {asset.warranty_expiry}
                <Tag color={isWarrantyActive ? 'green' : 'red'}>{isWarrantyActive ? t('common.active') : t('assetDetailPage.expiredStatus')}</Tag> {/* Rule 3 */}
              </Space>
            ) : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('assetDetailPage.healthScoreLabel')}> {/* Rule 4 */}
            {asset.health_score !== null ? (
              <Tag color={asset.health_score >= 80 ? 'green' : asset.health_score >= 50 ? 'orange' : 'red'}>{asset.health_score}%</Tag>
            ) : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('assetDetailPage.customerLabel')}> {/* Rule 4 */}
            {asset.contact ? `${asset.contact.first_name} ${asset.contact.last_name}` : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('assetDetailPage.locationLabel')} span={2}> {/* Rule 4 */}
            {asset.location?.address || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('assetDetailPage.notesLabel')} span={2}>{asset.notes || <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('common.createdAtLabel')}>{formatDateTime(asset.created_at)}</Descriptions.Item> {/* Rule 4 */}
          <Descriptions.Item label={t('common.updatedAtLabel')}>{formatDateTime(asset.updated_at)}</Descriptions.Item> {/* Rule 4 */}
        </Descriptions>
      </Card>

      <Card
        title={t('assetDetailPage.maintenancePlansCardTitle')}
        style={{ marginTop: 16 }}
        extra={
          <PermissionGuard permission="assets:create">
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => navigate(`/maintenance-plans/new?asset_id=${asset.id}`)}>
              {t('assetDetailPage.addPlanButton')} {/* Rule 3 */}
            </Button>
          </PermissionGuard>
        }
      >
        <Table
          columns={planColumns}
          dataSource={maintenancePlans || []}
          rowKey="id"
          loading={plansLoading}
          pagination={false}
          locale={{ emptyText: t('assetDetailPage.noMaintenancePlansEmptyText') }}
        />
      </Card>

      {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
        <Card title={t('assetDetailPage.customFieldsCardTitle')} style={{ marginTop: 16 }}> {/* Rule 4 */}
          <Descriptions column={2} bordered>
            {Object.entries(asset.custom_fields).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>{JSON.stringify(value)}</Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}