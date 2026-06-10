import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Descriptions, Button, Space, Skeleton, Tabs } from 'antd';
import { EditOutlined, DeleteOutlined, GlobalOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useCompany, useDeleteCompany } from '@/hooks/use-companies';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { EntityTimelineTab } from '@/components/common/EntityTimelineTab';
import { EntityInsightsTab } from '@/components/common/EntityInsightsTab';
import { EntityBillingTab } from '@/pages/invoices/components/EntityBillingTab';
import { EntityNotesTab } from '@/components/common/EntityNotesTab';
import { EntityAttachmentsTab } from '@/components/common/EntityAttachmentsTab';
import { CompanyChangeOwnerModal } from './components/CompanyBulkModals';
import { 
  EntityRelatedWorkOrdersTab, 
  EntityRelatedServiceRequestsTab,
  EntityRelatedEstimatesTab,
  EntityRelatedAppointmentsTab,
  EntityRelatedMaintenancePlansTab
} from '@/components/common/EntityRelatedLists';

import CompanyContactsTab from './components/CompanyContactsTab';
import CompanyLocationsTab from './components/CompanyLocationsTab';
import CompanyAssetsTab from './components/CompanyAssetsTab';

export default function CompanyDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading } = useCompany(id!);
  const deleteCompany = useDeleteCompany();
  const [isChangeOwnerModalOpen, setIsChangeOwnerModalOpen] = useState(false);

  const handleDelete = () => {
    if (!company) return;
    showConfirmDialog({
      title: t('companies.deleteCompany'),
      content: t('companies.deleteConfirmation', { name: company.name }),
      onOk: async () => {
        await deleteCompany.mutateAsync(company.id);
        navigate('/companies');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('companies.details')} />
        <Card>
          <Skeleton active />
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div>
        <PageHeader title={t('companies.notFoundTitle')} />
        <Card>{t('companies.notFoundMessage')}</Card>
      </div>
    );
  }

  const items = [
    {
      key: 'details',
      label: 'Details',
      children: (
        <div>
          <Card title={t('companies.information')} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label={t('companies.companyName')} span={2}>
                {company.name}
              </Descriptions.Item>

              <Descriptions.Item label={t('companies.industry')}>
                {company.industry || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>

              <Descriptions.Item label="Tax Registration Number">
                {company.tax_registration_number || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>

              <Descriptions.Item label="Tax Treatment">
                {company.tax_treatment || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>

              <Descriptions.Item label="Custom Vendor ID">
                {company.custom_vendor_id || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>

              <Descriptions.Item label={t('companies.website')} span={2}>
                {company.website ? (
                  <Space>
                    <GlobalOutlined />
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  </Space>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('companies.notes')} span={2}>
                {company.notes || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>

              <Descriptions.Item label="Created by">
                {company.creator ? (
                  <span>
                    {company.creator.first_name} {company.creator.last_name} (
                    <a href={`mailto:${company.creator.email}`}>{company.creator.email}</a>
                    )
                  </span>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('companies.createdAt')}>
                {formatDateTime(company.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label={t('companies.updatedAt')}>
                {formatDateTime(company.updated_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated by">
                {company.updater ? `${company.updater.first_name} ${company.updater.last_name}` : <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Billing Address" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Street">{company.billing_street || '-'}</Descriptions.Item>
              <Descriptions.Item label="City">{company.billing_city || '-'}</Descriptions.Item>
              <Descriptions.Item label="State">{company.billing_state || '-'}</Descriptions.Item>
              <Descriptions.Item label="Zip Code">{company.billing_zip_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="Country" span={2}>{company.billing_country || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {company.custom_fields && Object.keys(company.custom_fields).length > 0 && (
            <Card title={t('companies.customFields')} style={{ marginTop: 16 }}>
              <Descriptions column={2} bordered>
                {Object.entries(company.custom_fields).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {JSON.stringify(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: <EntityTimelineTab entityType="Company" entityId={company.id} />
    },
    {
      key: 'insights',
      label: 'Insights',
      children: <EntityInsightsTab entityType="Company" entityId={company.id} />
    },
    {
      key: 'contacts',
      label: 'Contacts',
      children: (
        <Card title="Company Contacts">
          <CompanyContactsTab companyId={company.id} />
        </Card>
      ),
    },
    {
      key: 'addresses',
      label: 'Addresses',
      children: (
        <Card title="Service Locations">
          <CompanyLocationsTab companyId={company.id} />
        </Card>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      children: <EntityNotesTab entityType="Company" entityId={company.id} />
    },
    {
      key: 'attachments',
      label: 'Attachments',
      children: <EntityAttachmentsTab entityType="Company" entityId={company.id} />
    },
    {
      key: 'related_lists',
      label: 'Related Lists',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card title="Related Assets">
            <CompanyAssetsTab companyId={company.id} />
          </Card>
          <Card title="Related Estimates">
            <EntityRelatedEstimatesTab companyId={company.id} />
          </Card>
          <Card title="Related Service Appointments">
            <EntityRelatedAppointmentsTab companyId={company.id} />
          </Card>
          <Card title="Related Work Orders">
            <EntityRelatedWorkOrdersTab companyId={company.id} />
          </Card>
          <Card title="Related Service Requests">
            <EntityRelatedServiceRequestsTab companyId={company.id} />
          </Card>
          <Card title="Scheduled Maintenance Plans">
            <EntityRelatedMaintenancePlansTab companyId={company.id} />
          </Card>
        </Space>
      ),
    },
    {
      key: 'billing',
      label: 'Billing',
      children: <EntityBillingTab companyId={company.id} />
    },
  ];

  return (
    <div>
      <PageHeader
        title={company.name}
        onBack={() => navigate('/companies')}
        extra={
          <Space>
            <PermissionGuard permission="companies:update">
              <Button icon={<UserSwitchOutlined />} onClick={() => setIsChangeOwnerModalOpen(true)}>
                Change Owner
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="companies:update">
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/companies/${company.id}/edit`)}
              >
                {t('companies.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="companies:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('companies.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />
      <Tabs defaultActiveKey="details" items={items} />
      <CompanyChangeOwnerModal 
        open={isChangeOwnerModalOpen} 
        onClose={() => setIsChangeOwnerModalOpen(false)} 
        selectedIds={[company.id]} 
      />
    </div>
  );
}