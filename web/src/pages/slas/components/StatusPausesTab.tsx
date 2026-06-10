import React, { useState } from 'react';
import { Table, Button, Modal, Form, Select, Typography, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSlaPolicies, usePauseTriggers, useCreatePauseTrigger, useUpdatePauseTrigger, useDeletePauseTrigger } from '@/hooks/use-slas';

const { Title, Text } = Typography;

export default function StatusPausesTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPause, setEditingPause] = useState<any>(null);
  const [form] = Form.useForm();
  const { t } = useTranslation();
  
  const { data: pauses, isLoading } = usePauseTriggers();
  const { data: policies } = useSlaPolicies();
  const createPauseMutation = useCreatePauseTrigger();
  const updatePauseMutation = useUpdatePauseTrigger();
  const deletePauseMutation = useDeletePauseTrigger();

  const openCreateModal = () => {
    setEditingPause(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingPause(record);
    form.setFieldsValue({
      sla_policy_id: record.sla_policy_id,
      trigger_status: record.status_name, // DB uses status_name, form used trigger_status
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deletePauseMutation.mutateAsync(id);
  };

  const handleSave = async (values: any) => {
    const payload = {
      sla_policy_id: values.sla_policy_id,
      trigger_status: values.trigger_status,
    };

    if (editingPause) {
      await updatePauseMutation.mutateAsync({ id: editingPause.id, payload });
    } else {
      await createPauseMutation.mutateAsync(payload);
    }
    
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: t('sla.policyName', 'SLA Policy'),
      key: 'sla_policy_id',
      render: (_: any, record: any) => record.policy?.name || policies?.find((p: any) => p.id === record.sla_policy_id)?.name || record.sla_policy_id,
    },
    { 
      title: t('sla.triggerStatus', 'Trigger Status'), 
      key: 'trigger_status',
      render: (_: any, record: any) => <Tag color="processing">{record.status_name || record.trigger_status}</Tag>
    },
    {
      title: t('common.status', 'Status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (active ? <Tag color="success">{t('common.active', 'Active')}</Tag> : <Tag color="default">{t('common.inactive', 'Inactive')}</Tag>),
    },
    {
      title: t('sla.actions', 'Actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title={t('sla.deleteConfirm', 'Delete this pause rule?')} onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} loading={deletePauseMutation.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('sla.statusPauses', 'Status Pauses')}</Title>
          <Text type="secondary">{t('sla.statusPausesDesc', 'Automatically pause the SLA countdown when tickets enter specific statuses.')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('sla.addPause', 'Add Pause Rule')}
        </Button>
      </div>

      <Table
        dataSource={pauses || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingPause ? t('sla.editPause', 'Edit Pause Rule') : t('sla.addPause', 'Add Pause Rule')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createPauseMutation.isPending || updatePauseMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="sla_policy_id" label={t('sla.policyName', 'SLA Policy')} rules={[{ required: true }]}>
            <Select placeholder="Select SLA Policy" allowClear showSearch optionFilterProp="children">
              {policies?.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="trigger_status" label={t('sla.triggerStatus', 'Trigger Status')} rules={[{ required: true }]}>
            <Select placeholder="Select Status to Pause On">
              <Select.Option value="Waiting on Customer">Waiting on Customer</Select.Option>
              <Select.Option value="Waiting on Parts">Waiting on Parts</Select.Option>
              <Select.Option value="On Hold">On Hold</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
