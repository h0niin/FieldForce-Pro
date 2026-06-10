import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Tag, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useContacts, useDeleteContact } from '@/hooks/use-contacts';
import type { Contact } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';
import { UploadOutlined, DownloadOutlined, UserSwitchOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { ContactImportModal, ContactChangeOwnerModal, ContactMergeModal } from './components/ContactBulkModals';
import { contactsApi } from '@/api/contacts.api';

export default function ContactListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useContacts({ page, take: pageSize, search });
  const deleteContact = useDeleteContact();

  const contacts = data?.data || [];
  const meta = data?.meta;

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Contact[]>([]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isChangeOwnerModalOpen, setIsChangeOwnerModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const handleExport = async (ids?: string[]) => {
    try {
      const response = await contactsApi.exportCsv(ids);
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export', error);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page when search changes
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleDelete = (contact: Contact) => {
    showConfirmDialog({
      title: t('contactList.deleteTitle'),
      content: t('contactList.deleteConfirm', { firstName: contact.first_name, lastName: contact.last_name }),
      onOk: async () => {
        await deleteContact.mutateAsync(contact.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<Contact> = [
    {
      title: t('contactList.name'),
      key: 'name',
      render: (_, record) => (
        <Link to={`/contacts/${record.id}`}>
          <span style={{ fontWeight: 500 }}>
            {record.first_name} {record.last_name}
          </span>
        </Link>
      ),
      sorter: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
    },
    {
      title: t('contactList.email'),
      dataIndex: 'email',
      key: 'email',
      render: (email: string) =>
        email ? (
          <Space>
            <MailOutlined />
            <a href={`mailto:${email}`}>{email}</a>
          </Space>
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        ),
    },
    {
      title: t('contactList.phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) =>
        phone ? (
          <Space>
            <PhoneOutlined />
            <a href={`tel:${phone}`}>{phone}</a>
          </Space>
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        ),
    },
    {
      title: t('contactList.tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) =>
        tags && tags.length > 0 ? (
          <>
            {tags.map((tag) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
          </>
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        ),
    },
    {
      title: t('contactList.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('contactList.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="contacts:read">
            <Tooltip title={t('common.view') || 'View'}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/contacts/${record.id}`);
                }}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="contacts:update">
            <Tooltip title={t('contactList.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/contacts/${record.id}/edit`);
                }}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="contacts:delete">
            <Tooltip title={t('contactList.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(record);
                }}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.contacts')}
        subtitle={t('contactList.subtitle')}
        extra={
          <Space>
            <PermissionGuard permission="contacts:create">
              <Button icon={<DownloadOutlined />} onClick={() => setIsImportModalOpen(true)}>
                Import
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="contacts:read">
              <Button icon={<UploadOutlined />} onClick={() => handleExport()}>
                Export
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="contacts:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/contacts/new')}
              >
                {t('contactList.addContact')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('contactList.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 4 }}>
          <Space>
            <span style={{ marginRight: 8 }}>{selectedRowKeys.length} items selected</span>
            <PermissionGuard permission="contacts:update">
              <Button size="small" icon={<UserSwitchOutlined />} onClick={() => setIsChangeOwnerModalOpen(true)}>
                Change Owner
              </Button>
            </PermissionGuard>
            {selectedRowKeys.length === 2 && (
              <PermissionGuard permission="contacts:delete">
                <Button size="small" type="primary" danger icon={<MergeCellsOutlined />} onClick={() => setIsMergeModalOpen(true)}>
                  Merge Records
                </Button>
              </PermissionGuard>
            )}
            <PermissionGuard permission="contacts:read">
              <Button size="small" icon={<UploadOutlined />} onClick={() => handleExport(selectedRowKeys as string[])}>
                Export Selected
              </Button>
            </PermissionGuard>
            <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedRecords([]); }}>Clear</Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={contacts}
        rowKey="id"
        loading={isLoading}
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys, newSelectedRecords) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedRecords(newSelectedRecords as Contact[]);
          },
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/contacts/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('contactList.totalContacts', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <ContactImportModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <ContactChangeOwnerModal 
        open={isChangeOwnerModalOpen} 
        onClose={() => { setIsChangeOwnerModalOpen(false); setSelectedRowKeys([]); setSelectedRecords([]); }} 
        selectedIds={selectedRowKeys as string[]} 
      />
      <ContactMergeModal 
        open={isMergeModalOpen} 
        onClose={() => { setIsMergeModalOpen(false); setSelectedRowKeys([]); setSelectedRecords([]); }} 
        selectedRecords={selectedRecords} 
      />
    </div>
  );
}