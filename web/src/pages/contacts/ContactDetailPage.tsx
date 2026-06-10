import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Descriptions, Tag, Button, Space, Skeleton, Tabs, Table } from 'antd';
import { EditOutlined, DeleteOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useContact, useDeleteContact } from '@/hooks/use-contacts';
import { useCompany } from '@/hooks/use-companies';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { EntityTimelineTab } from '@/components/common/EntityTimelineTab';
import { EntityInsightsTab } from '@/components/common/EntityInsightsTab';
import { EntityBillingTab } from '@/pages/invoices/components/EntityBillingTab';
import { EntityNotesTab } from '@/components/common/EntityNotesTab';
import { EntityAttachmentsTab } from '@/components/common/EntityAttachmentsTab';
import { EntityRelatedWorkOrdersTab, EntityRelatedServiceRequestsTab } from '@/components/common/EntityRelatedLists';
import ContactLocationsTab from './components/ContactLocationsTab';

export default function ContactDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id!);
  const { data: company } = useCompany(contact?.company_id || '');
  const deleteContact = useDeleteContact();

  const handleDelete = () => {
    if (!contact) return;
    showConfirmDialog({
      title: t('contactDetail.deleteContact'),
      content: t('contactDetail.deleteConfirm', { name: `${contact.first_name} ${contact.last_name}` }),
      onOk: async () => {
        await deleteContact.mutateAsync(contact.id);
        navigate('/contacts');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('contactDetail.contactDetails')} />
        <Card>
          <Skeleton active />
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div>
        <PageHeader title={t('contactDetail.contactNotFound')} />
        <Card>{t('contactDetail.contactNotFoundMessage')}</Card>
      </div>
    );
  }

  const items = [
    {
      key: 'details',
      label: 'Details',
      children: (
        <div>
          <Card title={t('contactDetail.contactInformation')} style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Company" span={2}>
                {company ? (
                  <Link to={`/companies/${company.id}`}>{company.name}</Link>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('contactDetail.firstName')}>{contact.first_name}</Descriptions.Item>
              <Descriptions.Item label={t('contactDetail.lastName')}>{contact.last_name}</Descriptions.Item>

              <Descriptions.Item label={t('contactDetail.email')} span={2}>
                {contact.email ? (
                  <Space>
                    <MailOutlined />
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </Space>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('contactDetail.phone')} span={2}>
                {contact.phone ? (
                  <Space>
                    <PhoneOutlined />
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </Space>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Service Address">
                {contact.service_address ? (
                  <Space>
                    <EnvironmentOutlined />
                    {contact.service_address}
                  </Space>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Billing Address">
                {contact.billing_address ? (
                  <Space>
                    <EnvironmentOutlined />
                    {contact.billing_address}
                  </Space>
                ) : (
                  <span style={{ opacity: 0.5 }}>-</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('contactDetail.tags')} span={2}>
                {contact.tags && contact.tags.length > 0 ? (
                  <Space wrap>
                    {contact.tags.map((tag) => (
                      <Tag key={tag} color="blue">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <span style={{ color: '#999' }}>{t('contactDetail.noTags')}</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('contactDetail.createdAt')}>
                {formatDateTime(contact.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label={t('contactDetail.updatedAt')}>
                {formatDateTime(contact.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
            <Card title={t('contactDetail.customFields')} style={{ marginTop: 16 }}>
              <Descriptions column={2} bordered>
                {Object.entries(contact.custom_fields).map(([key, value]) => (
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
      children: <EntityTimelineTab entityType="Contact" entityId={contact.id} />
    },
    {
      key: 'insights',
      label: 'Insights',
      children: <EntityInsightsTab entityType="Contact" entityId={contact.id} />
    },
    {
      key: 'addresses',
      label: 'Addresses',
      children: (
        <Card title="Service Locations">
          <ContactLocationsTab contactId={contact.id} />
        </Card>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      children: <EntityNotesTab entityType="Contact" entityId={contact.id} />
    },
    {
      key: 'attachments',
      label: 'Attachments',
      children: <EntityAttachmentsTab entityType="Contact" entityId={contact.id} />
    },
    {
      key: 'related_lists',
      label: 'Related Lists',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card title="Related Service Requests">
            <EntityRelatedServiceRequestsTab contactId={contact.id} />
          </Card>
          <Card title="Related Work Orders">
            <EntityRelatedWorkOrdersTab contactId={contact.id} />
          </Card>
        </Space>
      ),
    },
    {
      key: 'billing',
      label: 'Billing',
      children: <EntityBillingTab contactId={contact.id} />
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${contact.first_name} ${contact.last_name}`}
        onBack={() => navigate('/contacts')}
        extra={
          <Space>
            <PermissionGuard permission="contacts:update">
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/contacts/${contact.id}/edit`)}
              >
                {t('contactDetail.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="contacts:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('contactDetail.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />
      <Tabs defaultActiveKey="details" items={items} />
    </div>
  );
}