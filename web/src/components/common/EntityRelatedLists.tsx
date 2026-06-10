import React from 'react';
import { Table, Tag } from 'antd';
import { useWorkOrders } from '@/hooks/use-work-orders';
import { useServiceRequests } from '@/hooks/use-service-requests';
import { useEstimates } from '@/hooks/use-estimates';
import { useAppointments } from '@/hooks/use-appointments';
import { useMaintenancePlans } from '@/hooks/use-maintenance-plans';
import { useAssets } from '@/hooks/use-assets';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';
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

export function EntityRelatedEstimatesTab({ companyId, contactId, assetId }: Props) {
  const { data, isLoading } = useEstimates({
    company_id: companyId,
    contact_id: contactId,
    asset_id: assetId,
  });

  const columns = [
    {
      title: 'Estimate Number',
      dataIndex: 'estimate_number',
      key: 'estimate_number',
      render: (val: string, record: any) => <Link to={`/estimates/${record.id}`}>{val}</Link>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color="blue">{formatEnumText(val)}</Tag>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (val: number, record: any) => formatCurrency(val, record.currency || 'USD'),
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
      locale={{ emptyText: 'No estimates found' }}
    />
  );
}

export function EntityRelatedAppointmentsTab({ companyId, contactId, assetId }: Props) {
  const { data, isLoading } = useAppointments({
    company_id: companyId,
    contact_id: contactId,
    asset_id: assetId,
  });

  const columns = [
    {
      title: 'Appointment ID',
      dataIndex: 'id',
      key: 'id',
      render: (val: string, record: any) => <Link to={`/dispatch/${record.id}`}>{val.substring(0, 8)}</Link>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color="green">{formatEnumText(val)}</Tag>,
    },
    {
      title: 'Scheduled Start',
      dataIndex: 'scheduled_start_time',
      key: 'scheduled_start_time',
      render: (val: string) => formatDateTime(val),
    },
    {
      title: 'Actual Duration (mins)',
      dataIndex: 'actual_duration_minutes',
      key: 'actual_duration_minutes',
    },
  ];

  return (
    <Table
      dataSource={Array.isArray(data?.data?.data) ? data.data.data : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 5 }}
      locale={{ emptyText: 'No service appointments found' }}
    />
  );
}

export function EntityRelatedMaintenancePlansTab({ companyId, contactId, assetId }: Props) {
  const { data, isLoading } = useMaintenancePlans({
    company_id: companyId,
    asset_id: assetId,
  });

  const columns = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color="blue">{formatEnumText(val)}</Tag>,
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (val: string) => formatEnumText(val),
    },
    {
      title: 'Next Date',
      dataIndex: 'next_maintenance_date',
      key: 'next_maintenance_date',
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
      locale={{ emptyText: 'No maintenance plans found' }}
    />
  );
}

export function EntityRelatedAssetsTab({ companyId, contactId }: Props) {
  const { data, isLoading } = useAssets({
    company_id: companyId,
    contact_id: contactId,
  });

  const columns = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (val: string, record: any) => <Link to={`/assets/${record.id}`}>{val}</Link>,
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      key: 'serial_number',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color="green">{formatEnumText(val)}</Tag>,
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
      locale={{ emptyText: 'No related assets found' }}
    />
  );
}

