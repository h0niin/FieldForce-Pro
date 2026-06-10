import React from 'react';
import { Table, Tag } from 'antd';
import { useWorkOrders } from '@/hooks/use-work-orders';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { formatDateTime } from '@/utils/format-date';
import { formatEnumText } from '@/utils/string';
import { Link } from 'react-router-dom';

interface Props {
  companyId?: string;
  contactId?: string;
  assetId?: string;
}

export function EntityRelatedWorkOrdersTab({ companyId, contactId, assetId }: Props) {
  const { data, isLoading } = useWorkOrders({
    company_id: companyId,
    contact_id: contactId,
    asset_id: assetId,
  });

  const columns = [
    {
      title: 'WO Number',
      dataIndex: 'wo_number',
      key: 'wo_number',
      render: (val: string, record: any) => <Link to={`/work-orders/${record.id}`}>{val}</Link>,
    },
    {
      title: 'Title',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color="blue">{formatEnumText(val)}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (val: string) => formatEnumText(val),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
  ];

  return (
    <Table
      dataSource={Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 5 }}
      locale={{ emptyText: 'No work orders found' }}
    />
  );
}

export function EntityRelatedServiceRequestsTab({ companyId, contactId, assetId }: Props) {
  const { data, isLoading } = useServiceRequests({
    company_id: companyId,
    contact_id: contactId,
    asset_id: assetId,
  });

  const columns = [
    {
      title: 'SR Number',
      dataIndex: 'request_number',
      key: 'request_number',
      render: (val: string, record: any) => <Link to={`/service-requests/${record.id}`}>{val}</Link>,
    },
    {
      title: 'Title',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color="orange">{formatEnumText(val)}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (val: string) => formatEnumText(val),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => formatDateTime(val),
    },
  ];

  return (
    <Table
      dataSource={Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 5 }}
      locale={{ emptyText: 'No service requests found' }}
    />
  );
}
