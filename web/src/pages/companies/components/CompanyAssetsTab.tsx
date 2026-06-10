import { useState } from 'react';
import { Table, Tag, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { useAssets } from '@/hooks/use-assets';
import type { Asset } from '@/types/models.types';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatEnumText } from '@/utils/string';

interface CompanyAssetsTabProps {
  companyId: string;
}

export default function CompanyAssetsTab({ companyId }: CompanyAssetsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useAssets({ page, take: pageSize, company_id: companyId });

  const assets = Array.isArray(data?.data?.data) 
    ? data.data.data 
    : Array.isArray(data?.data) 
      ? data.data 
      : Array.isArray(data) 
        ? data 
        : [];
  const meta = data?.meta;

  const columns: ColumnsType<Asset> = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'OPERATIONAL' ? 'success' : 'default'}>
          {formatEnumText(status) || 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/assets/${record.id}`)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/assets/${record.id}/edit`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={assets}
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
