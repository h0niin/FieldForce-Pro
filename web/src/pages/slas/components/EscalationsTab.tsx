import React, { useState } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Typography, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSlaPolicies, useEscalations, useCreateEscalation, useUpdateEscalation, useDeleteEscalation } from '@/hooks/use-slas';

const { Title, Text } = Typography;

export default function EscalationsTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEscalation, setEditingEscalation] = useState<any>(null);
  const [form] = Form.useForm();
  const { t } = useTranslation();
  
  const { data: escalations, isLoading } = useEscalations();
  const { data: policies } = useSlaPolicies();
  const createEscalationMutation = useCreateEscalation();
  const updateEscalationMutation = useUpdateEscalation();
  const deleteEscalationMutation = useDeleteEscalation();

  const openCreateModal = () => {
    setEditingEscalation(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingEscalation(record);
    form.setFieldsValue({
      sla_policy_id: record.sla_policy_id,
      trigger_type: record.target_type, // The DB uses target_type, but form used trigger_type
      time_threshold_minutes: record.trigger_time_minutes,
      warning_percentage: record.warning_percentage,
      action: record.actions?.type || record.actions,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deleteEscalationMutation.mutateAsync(id);
  };

  const handleSave = async (values: any) => {
    const payload = {
      sla_policy_id: values.sla_policy_id,
      trigger_type: values.trigger_type,
      time_threshold_minutes: values.time_threshold_minutes,
      warning_percentage: values.warning_percentage,
      action: values.action,
    };

    if (editingEscalation) {
      await updateEscalationMutation.mutateAsync({ id: editingEscalation.id, payload });
    } else {
      await createEscalationMutation.mutateAsync(payload);
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
      title: t('sla.triggerType', 'Trigger Type'), 
      dataIndex: 'trigger_type', 
      key: 'trigger_type',
      render: (type: string) => (
        <Tag color={type === 'warning' ? 'warning' : 'error'}>
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    { 
      title: t('sla.timeThreshold', 'Time Threshold (mins)'), 
      dataIndex: 'time_threshold_minutes', 
      key: 'time_threshold_minutes' 
    },
    { 
      title: t('sla.warningPercentage', 'Warning (%)'), 
      dataIndex: 'warning_percentage', 
      key: 'warning_percentage',
      render: (val: number) => val ? `${val}%` : '-'
    },
    { 
      title: t('sla.actionToTake', 'Action'), 
      dataIndex: 'action', 
      key: 'action',
      render: (action: string) => {
        const actionMap: Record<string, string> = {
          'notify_technician': 'Notify Technician',
          'notify_manager': 'Notify Manager',
          'reassign': 'Re-assign Request'
        };
        return actionMap[action] || action;
      }
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
          <Popconfirm title={t('sla.deleteConfirm', 'Delete this escalation?')} onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} loading={deleteEscalationMutation.isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('sla.escalations', 'Escalations & Alerts')}</Title>
          <Text type="secondary">{t('sla.escalationsDesc', 'Define rules to notify managers or re-assign requests when SLAs are nearing breach.')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('sla.addEscalation', 'Add Escalation')}
        </Button>
      </div>

      <Table
        dataSource={escalations || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingEscalation ? t('sla.editEscalation', 'Edit Escalation Rule') : t('sla.addEscalation', 'Add Escalation Rule')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createEscalationMutation.isPending || updateEscalationMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="sla_policy_id" label={t('sla.policyName', 'SLA Policy')} rules={[{ required: true }]}>
            <Select placeholder="Select SLA Policy" allowClear showSearch optionFilterProp="children">
              {policies?.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="trigger_type" label={t('sla.triggerType', 'Trigger Type')} rules={[{ required: true }]} style={{ width: 220 }}>
              <Select placeholder="Select Type">
                <Select.Option value="warning">Warning (Before Breach)</Select.Option>
                <Select.Option value="breach">Breach (After Breach)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="time_threshold_minutes" label={t('sla.timeThreshold', 'Time Threshold (Mins)')} rules={[{ required: true }]} style={{ width: 220 }}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 15" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="warning_percentage" label={t('sla.warningPercentage', 'Pre-Breach Warning (%)')} style={{ width: 220 }}>
              <InputNumber min={1} max={99} style={{ width: '100%' }} placeholder="e.g. 75" />
            </Form.Item>

            <Form.Item name="action" label={t('sla.actionToTake', 'Action to Take')} rules={[{ required: true }]} style={{ width: 220 }}>
              <Select placeholder="Select Action">
                <Select.Option value="notify_technician">Notify Technician</Select.Option>
                <Select.Option value="notify_manager">Notify Manager</Select.Option>
                <Select.Option value="reassign">Re-assign Request</Select.Option>
                <Select.Option value="Notify">Notify Admin</Select.Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
