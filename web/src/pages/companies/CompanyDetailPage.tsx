import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Descriptions, Button, Space, Skeleton } from 'antd';
import { EditOutlined, DeleteOutlined, GlobalOutlined } from '@ant-design/icons';
import { useCompany, useDeleteCompany } from '@/hooks/use-companies';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

export default function CompanyDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading } = useCompany(id!);
  const deleteCompany = useDeleteCompany();

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

  return (
    <div>
      <PageHeader
        title={company.name}
        onBack={() => navigate('/companies')}
        extra={
          <Space>
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

      <Card title={t('companies.information')}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('companies.companyName')} span={2}>
            {company.name}
          </Descriptions.Item>

          <Descriptions.Item label={t('companies.industry')}>
            {company.industry || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('companies.taxId')}>
            {company.tax_id || <span style={{ opacity: 0.5 }}>-</span>}
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

          <Descriptions.Item label={t('companies.billingAddress')} span={2}>
            {company.billing_address || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('companies.notes')} span={2}>
            {company.notes || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('companies.createdAt')}>
            {formatDateTime(company.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('companies.updatedAt')}>
            {formatDateTime(company.updated_at)}
          </Descriptions.Item>
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
  );
}