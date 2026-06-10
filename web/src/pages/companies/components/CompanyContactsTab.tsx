import { useState } from 'react';
import { Table, Tag, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useContacts } from '@/hooks/use-contacts';
import type { Contact } from '@/types/models.types';
import { EyeOutlined, EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface CompanyContactsTabProps {
  companyId: string;
}

export default function CompanyContactsTab({ companyId }: CompanyContactsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useContacts({ page, take: pageSize, company_id: companyId });

  const contacts = data?.data || [];
  const meta = data?.meta;

  const columns: ColumnsType<Contact> = [
    {
      title: t('contactList.name'),
      key: 'name',
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          {record.first_name} {record.last_name}
        </span>
      ),
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
      title: t('contactList.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/contacts/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/contacts/${record.id}/edit`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={contacts}
      rowKey="id"
      loading={isLoading}
      pagination={{
        current: page,
        pageSize,
        total: meta?.itemCount || 0,
        showSizeChanger: true,
        onChange: (newPage, newPageSize) => {
          setPage(newPage);
          setPageSize(newPageSize);
        },
      }}
    />
  );
}
