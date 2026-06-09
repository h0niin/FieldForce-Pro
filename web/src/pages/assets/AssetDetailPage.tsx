import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Table, Tabs, Typography, Row, Col, Empty, Divider } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAsset, useDeleteAsset, useAssets } from '@/hooks/use-assets';
import { useAssetMaintenancePlans } from '@/hooks/use-maintenance-plans';
import { useWorkOrders } from '@/hooks/use-work-orders';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { useEstimates } from '@/hooks/use-estimates';
import type { AssetMaintenancePlan, WorkOrder, ServiceRequest, Estimate, Asset } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { formatEnumText } from '@/utils/string';
import { EntityTimelineTab } from '@/components/common/EntityTimelineTab';

const { Title, Text } = Typography;

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const assetQuery = useAsset(id!);
  const asset = (assetQuery.data as any)?.data?.data || (assetQuery.data as any)?.data || assetQuery.data;
  const { data: maintenancePlans, isLoading: plansLoading } = useAssetMaintenancePlans(id!);
  const { data: workOrdersData, isLoading: woLoading } = useWorkOrders({ asset_id: id } as any);
  const { data: serviceRequestsData, isLoading: srLoading } = useServiceRequests({ asset_id: id } as any);
  const { data: estimatesData, isLoading: estLoading } = useEstimates({ asset_id: id } as any);
  const { data: childAssetsData, isLoading: childAssetsLoading } = useAssets({ parent_asset_id: id } as any);

  const deleteAsset = useDeleteAsset();

  const handleDelete = () => {
    if (!asset) return;
    showConfirmDialog({
      title: t('assetDetailPage.deleteAssetTitle'),
      content: t('assetDetailPage.deleteConfirmContent', { assetName: asset.name }),
      onOk: async () => {
        await deleteAsset.mutateAsync(asset.id);
        navigate('/assets');
      },
      danger: true,
    });
  };

  if (assetQuery.isLoading) {
    return (
      <div>
        <PageHeader title={t('assetDetailPage.assetDetailsTitle')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (assetQuery.isError || !asset) {
    return (
      <div>
        <PageHeader title={t('assetDetailPage.assetNotFoundTitle')} />
        <Card>{t('assetDetailPage.assetNotFoundMessage')}</Card>
      </div>
    );
  }

  const warrantyExpiry = asset.warranty_expiry ? new Date(asset.warranty_expiry) : null;
  const isWarrantyActive = warrantyExpiry ? warrantyExpiry > new Date() : false;

  // -- Table Columns --
  const planColumns: ColumnsType<AssetMaintenancePlan> = [
    { title: 'Plan Name', dataIndex: 'name', key: 'name' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', render: (f) => <Tag>{f}</Tag> },
    { title: 'Next Due', dataIndex: 'next_due_date', key: 'next_due_date', render: (d) => d || '-' },
    { title: 'Active', dataIndex: 'is_active', key: 'is_active', render: (v) => v ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag> },
  ];

  const woColumns: ColumnsType<WorkOrder> = [
    { title: 'WO Number', dataIndex: 'wo_number', key: 'wo_number', render: (text, record) => <a onClick={() => navigate(`/work-orders/${record.id}`)}>{text}</a> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
    { title: 'Scheduled Start', dataIndex: 'scheduled_start_time', key: 'scheduled_start_time', render: (d) => d ? formatDateTime(d) : '-' },
  ];

  const srColumns: ColumnsType<ServiceRequest> = [
    { title: 'Request Title', dataIndex: 'title', key: 'title', render: (text, record) => <a onClick={() => navigate(`/service-requests/${record.id}`)}>{text}</a> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p) => <Tag>{p}</Tag> },
  ];

  const estColumns: ColumnsType<Estimate> = [
    { title: 'Estimate #', dataIndex: 'estimate_number', key: 'estimate_number', render: (text, record) => <a onClick={() => navigate(`/estimates/${record.id}`)}>{text}</a> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
    { title: 'Total', dataIndex: 'total_amount', key: 'total_amount' },
  ];

  const childAssetColumns: ColumnsType<Asset> = [
    { title: 'Asset Name', dataIndex: 'name', key: 'name', render: (text, record) => <a onClick={() => navigate(`/assets/${record.id}`)}>{text}</a> },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
  ];

  // -- Data Extraction (Safe Parsing) --
  const workOrders = (workOrdersData as any)?.data?.data || (workOrdersData as any)?.data || [];
  const serviceRequests = (serviceRequestsData as any)?.data?.data || (serviceRequestsData as any)?.data || [];
  const estimates = (estimatesData as any)?.data?.data || (estimatesData as any)?.data || [];
  const childAssets = (childAssetsData as any)?.data?.data || (childAssetsData as any)?.data || [];

  return (
    <div>
      <PageHeader
        title={asset.name}
        onBack={() => navigate('/assets')}
        extra={
          <Space>
            <PermissionGuard permission="assets:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/assets/${asset.id}/edit`)}>Edit Asset</Button>
            </PermissionGuard>
            <PermissionGuard permission="assets:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Delete</Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Row gutter={24}>
        {/* Left Sidebar: Details Pane */}
        <Col xs={24} md={8} lg={6}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            <Card title="Asset Details" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Status</Text>
                  <div>
                    <Tag color={asset.status === 'OPERATIONAL' ? 'success' : asset.status === 'NEEDS_REPAIR' ? 'warning' : asset.status === 'IN_REPAIR' ? 'processing' : 'default'}>
                      {asset.status ? formatEnumText(asset.status) : 'Operational'}
                    </Tag>
                  </div>
                </div>
                <div><Text type="secondary">Model</Text><div>{asset.model || '-'}</div></div>
                <div><Text type="secondary">Serial Number</Text><div>{asset.serial_number || '-'}</div></div>
                <div><Text type="secondary">Manufacturer</Text><div>{asset.manufacturer || '-'}</div></div>
                <div><Text type="secondary">GIAI</Text><div>{asset.giai || '-'}</div></div>
                <div><Text type="secondary">Service & Part</Text><div>{asset.product_category || '-'}</div></div>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <div><Text type="secondary">Installation Date</Text><div>{asset.installation_date || '-'}</div></div>
                <div><Text type="secondary">Ordered Date</Text><div>{asset.ordered_date || '-'}</div></div>
                <div><Text type="secondary">Purchased Date</Text><div>{asset.purchased_date || '-'}</div></div>
                <div>
                  <Text type="secondary">Warranty Expiry</Text>
                  <div>
                    {asset.warranty_expiry ? (
                      <Space>
                        {asset.warranty_expiry}
                        <Tag color={isWarrantyActive ? 'green' : 'red'}>{isWarrantyActive ? 'Active' : 'Expired'}</Tag>
                      </Space>
                    ) : '-'}
                  </div>
                </div>

                {asset.parent_asset && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <Text type="secondary">Parent Asset</Text>
                      <div><a onClick={() => navigate(`/assets/${asset.parent_asset!.id}`)}>{asset.parent_asset!.name}</a></div>
                    </div>
                  </>
                )}
              </Space>
            </Card>

            <Card title="Contact Details" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {asset.company ? (
                  <>
                    <div><Text type="secondary">Company</Text><div><a onClick={() => navigate(`/companies/${asset.company!.id}`)}>{asset.company!.name}</a></div></div>
                    {asset.company.phone && <div><Text type="secondary">Company Phone</Text><div>{asset.company.phone}</div></div>}
                  </>
                ) : <div><Text type="secondary">Company</Text><div>-</div></div>}

                <Divider style={{ margin: '12px 0' }} />

                {asset.contact ? (
                  <>
                    <div><Text type="secondary">Contact Name</Text><div><a onClick={() => navigate(`/contacts/${asset.contact!.id}`)}>{asset.contact!.first_name} {asset.contact!.last_name}</a></div></div>
                    {asset.contact.email && <div><Text type="secondary">Email</Text><div>{asset.contact.email}</div></div>}
                    {asset.contact.phone && <div><Text type="secondary">Phone</Text><div>{asset.contact.phone}</div></div>}
                  </>
                ) : <div><Text type="secondary">Contact</Text><div>-</div></div>}
              </Space>
            </Card>

            <Card title="System Info" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text type="secondary">Created At</Text><div>{formatDateTime(asset.created_at)}</div></div>
                <div><Text type="secondary">Updated At</Text><div>{formatDateTime(asset.updated_at)}</div></div>
              </Space>
            </Card>

          </Space>
        </Col>

        {/* Right Main Area: Tabs */}
        <Col xs={24} md={16} lg={18}>
          <Card bodyStyle={{ padding: '0 24px 24px' }}>
            <Tabs defaultActiveKey="timeline">
              
              <Tabs.TabPane tab="Timeline" key="timeline">
                <div style={{ paddingTop: 16 }}>
                  <EntityTimelineTab entityType="Asset" entityId={asset.id} />
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Notes & Attachments" key="notes">
                <div style={{ paddingTop: 16 }}>
                  <Card title="Notes" size="small" style={{ marginBottom: 16 }}>
                    {asset.notes ? <Text>{asset.notes}</Text> : <Empty description="No notes available" />}
                  </Card>
                  
                  {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
                    <Card title="Custom Fields" size="small">
                      <Descriptions column={2} bordered size="small">
                        {Object.entries(asset.custom_fields).map(([key, value]) => (
                          <Descriptions.Item key={key} label={key}>{JSON.stringify(value)}</Descriptions.Item>
                        ))}
                      </Descriptions>
                    </Card>
                  )}
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane tab="Related Lists" key="related_lists">
                <div style={{ paddingTop: 16 }}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    
                    {/* Child Assets */}
                    <Card 
                      title="Child Assets" 
                      size="small"
                      extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => navigate(`/assets/new?parent_asset_id=${asset.id}`)}>Create Child Asset</Button>}
                    >
                      <Table columns={childAssetColumns} dataSource={childAssets} rowKey="id" pagination={false} loading={childAssetsLoading} size="small" locale={{ emptyText: 'No child assets' }} />
                    </Card>

                    {/* Service Requests */}
                    <Card 
                      title="Service Requests" 
                      size="small"
                      extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => navigate(`/service-requests/new?asset_id=${asset.id}`)}>Create Request</Button>}
                    >
                      <Table columns={srColumns} dataSource={serviceRequests} rowKey="id" pagination={false} loading={srLoading} size="small" locale={{ emptyText: 'No service requests' }} />
                    </Card>

                    {/* Estimates */}
                    <Card 
                      title="Estimates" 
                      size="small"
                      extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => navigate(`/estimates/new?asset_id=${asset.id}`)}>Create Estimate</Button>}
                    >
                      <Table columns={estColumns} dataSource={estimates} rowKey="id" pagination={false} loading={estLoading} size="small" locale={{ emptyText: 'No estimates' }} />
                    </Card>

                    {/* Work Orders */}
                    <Card 
                      title="Service Appointments / Work Orders" 
                      size="small"
                      extra={<Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => navigate(`/work-orders/new?asset_id=${asset.id}`)}>Create Work Order</Button>}
                    >
                      <Table columns={woColumns} dataSource={workOrders} rowKey="id" pagination={false} loading={woLoading} size="small" locale={{ emptyText: 'No work orders' }} />
                    </Card>

                    {/* Maintenance Plans */}
                    <Card 
                      title="Scheduled Maintenances" 
                      size="small"
                      extra={
                        <PermissionGuard permission="assets:create">
                          <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => navigate(`/maintenance-plans/new?asset_id=${asset.id}`)}>Add Plan</Button>
                        </PermissionGuard>
                      }
                    >
                      <Table columns={planColumns} dataSource={maintenancePlans || []} rowKey="id" pagination={false} loading={plansLoading} size="small" locale={{ emptyText: 'No maintenance plans' }} />
                    </Card>

                  </Space>
                </div>
              </Tabs.TabPane>

            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
}