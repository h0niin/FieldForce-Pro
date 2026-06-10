import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, Typography, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSlaPolicies, useCreateSlaPolicy, useUpdateSlaPolicy, useDeleteSlaPolicy } from '@/hooks/use-slas';
import { useCategories, useSubCategories, usePriorities } from '@/hooks/use-lookups';
import { useAllServiceLocations } from '@/hooks/use-service-locations';
import { formatMinutesToReadableTime } from '@/utils/format-time';

const { Title, Text } = Typography;

export default function SlaMatrixTab() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [form] = Form.useForm();
  const { t } = useTranslation();
  
  const { data: policies, isLoading } = useSlaPolicies();
  const createPolicyMutation = useCreateSlaPolicy();
  const updatePolicyMutation = useUpdateSlaPolicy();
  const deletePolicyMutation = useDeleteSlaPolicy();

  // Lookup Hooks
  const { data: categories } = useCategories();
  const categoryId = Form.useWatch('category_id', form);
  const { data: subCategories } = useSubCategories(categoryId);
  const { data: priorities } = usePriorities();
  const { data: locations } = useAllServiceLocations();
  const uniqueLocations = Array.from(
    new Map((locations || []).map((l: any) => [l.address || l.name, l])).values()
  );

  const openCreateModal = () => {
    setEditingRule(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (record: any) => {
    setEditingRule(record);
    const parseTime = (minutes: number) => {
      if (minutes % 1440 === 0 && minutes !== 0) return { value: minutes / 1440, unit: 'days' };
      if (minutes % 60 === 0 && minutes !== 0) return { value: minutes / 60, unit: 'hours' };
      return { value: minutes || 1, unit: 'minutes' };
    };

    const response = parseTime(record.response_time_minutes);
    const completion = parseTime(record.resolution_time_minutes);

    form.setFieldsValue({
      name: record.name,
      category_id: record.category_id,
      sub_category_id: record.sub_category_id,
      priority_id: record.priority_id,
      location_id: record.location_id,
      response_time_value: response.value,
      response_time_unit: response.unit,
      completion_time_value: completion.value,
      completion_time_unit: completion.unit,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    await deletePolicyMutation.mutateAsync(id);
  };

  const handleSave = async (values: any) => {
    const getMultiplier = (unit: string) => {
      if (unit === 'hours') return 60;
      if (unit === 'days') return 1440;
      return 1;
    };

    const responseMins = values.response_time_value * getMultiplier(values.response_time_unit);
    const completionMins = values.completion_time_value * getMultiplier(values.completion_time_unit);

    if (completionMins <= responseMins) {
      message.error(t('sla.completionGreaterThanResponseError', 'Completion time must be strictly greater than Response time.'));
      return;
    }

    const cleanId = (val: any) => (!val || String(val).trim() === '') ? null : val;

    const payload: any = {
      name: values.name,
      category_id: cleanId(values.category_id),
      sub_category_id: cleanId(values.sub_category_id),
      priority_id: cleanId(values.priority_id),
      // location_id is excluded until the architecture mismatch is resolved
      time_unit: 'minutes',
      response_time_minutes: responseMins,
      resolution_time_minutes: completionMins,
    };

    if (editingRule) {
      await updatePolicyMutation.mutateAsync({ id: editingRule.id, payload });
    } else {
      await createPolicyMutation.mutateAsync(payload);
    }
    
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { 
      title: t('sla.ruleName', 'Name'), 
      dataIndex: 'name', 
      key: 'name',
      render: (name: string) => {
        if (name?.startsWith('Default ')) {
          const priorityStr = name.replace('Default ', '').replace(' SLA', '').trim();
          return `${t('sla.defaultSla', 'Default')} ${priorityStr ? t(`priorities.${priorityStr}`, priorityStr) : ''} SLA`;
        }
        return name;
      }
    },
    {
      title: t('sla.category', 'Category'),
      dataIndex: 'category_id',
      key: 'category_id',
      render: (id: string) => {
        const cat = categories?.find((c: any) => c.id === id);
        return cat ? t(`categories.${cat.name}`, cat.name) : '-';
      },
    },
    {
      title: t('sla.subCategory', 'Sub-category'),
      dataIndex: 'sub_category_id',
      key: 'sub_category_id',
      render: (id: string) => {
        const subCat = subCategories?.find((sc: any) => sc.id === id);
        return subCat ? t(`subCategories.${subCat.name}`, subCat.name) : '-';
      },
    },
    {
      title: t('sla.priority', 'Priority'),
      dataIndex: 'priority_id',
      key: 'priority_id',
      render: (id: string) => {
        const prio = priorities?.find((p: any) => p.id === id);
        return prio ? t(`priorities.${prio.name}`, prio.name) : '-';
      },
    },
    {
      title: t('sla.location', 'Location'),
      dataIndex: 'location_id',
      key: 'location_id',
      render: (id: string) => locations?.find((l: any) => l.id === id)?.address || '-',
    },
    {
      title: t('sla.responseSla', 'Response SLA'),
      key: 'response_time',
      render: (_: any, record: any) => {
        if (record.response_time_minutes === 0) return '-';
        return <Tag color="blue">{formatMinutesToReadableTime(record.response_time_minutes)}</Tag>;
      },
    },
    {
      title: t('sla.completionSla', 'Completion SLA'),
      key: 'resolution_time',
      render: (_: any, record: any) => {
        if (record.resolution_time_minutes === 0) return '-';
        return <Tag color="green">{formatMinutesToReadableTime(record.resolution_time_minutes)}</Tag>;
      },
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
      render: (_: any, record: any) => {
        const isDefault = record.name?.startsWith('Default ');
        return (
          <Space>
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
            {!isDefault && (
              <Popconfirm title={t('sla.deleteConfirm', 'Delete this rule?')} onConfirm={() => handleDelete(record.id)}>
                <Button type="text" danger icon={<DeleteOutlined />} loading={deletePolicyMutation.isPending} />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('sla.matrix', 'SLA Matrix')}</Title>
          <Text type="secondary">{t('sla.matrixDesc', 'Configure Response and Completion SLAs based on categories, priorities, and locations.')}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          {t('sla.addRule', 'Add Rule')}
        </Button>
      </div>

      <Table
        dataSource={policies || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title={editingRule ? t('sla.editRule', 'Edit SLA Rule') : t('sla.addRule', 'Add SLA Rule')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createPolicyMutation.isPending || updatePolicyMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label={t('sla.ruleName', 'Rule Name')} rules={[{ required: true }]}>
            <Input placeholder={t('sla.ruleNamePlaceholder', 'e.g. High Priority Plumbing')} />
          </Form.Item>
          
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="category_id" label={t('sla.category', 'Category')} style={{ width: 220 }}>
              <Select 
                placeholder={t('sla.selectCategory', 'Select Category')} 
                allowClear 
                onChange={() => form.setFieldValue('sub_category_id', undefined)}
                options={categories?.map((c: any) => ({ label: String(t(`categories.${c.name}`, c.name)), value: c.id }))}
              />
            </Form.Item>

            <Form.Item name="sub_category_id" label={t('sla.subCategory', 'Sub-category')} style={{ width: 220 }}>
              <Select 
                placeholder={t('sla.selectSubCategory', 'Select Sub-category')}
                allowClear
                options={subCategories?.map((sc: any) => ({ label: String(t(`subCategories.${sc.name}`, sc.name)), value: sc.id }))}
              />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="priority_id" label={t('sla.priority', 'Priority')} style={{ width: 220 }}>
              <Select 
                placeholder={t('sla.selectPriority', 'Select Priority')}
                allowClear
                options={priorities?.map((p: any) => ({ label: String(t(`priorities.${p.name}`, p.name)), value: p.id }))}
              />
            </Form.Item>

            <Form.Item name="location_id" label={t('sla.location', 'Location')} style={{ width: 220 }}>
              <Select 
                placeholder={t('sla.selectLocation', 'Select Location')} 
                allowClear 
                onChange={(val) => console.log('Location Dropdown Selected Value:', val)}
                options={uniqueLocations.map((l: any) => ({ label: l.address || l.name, value: l.id }))}
              />
            </Form.Item>
          </Space>

          <Title level={5} style={{ marginTop: 16 }}>{t('sla.responseSla', 'Response SLA')}</Title>
          <Space style={{ width: '100%' }} size="large" align="start">
            <Form.Item name="response_time_value" rules={[{ required: true, message: t('sla.enterResponseValue', 'Please enter Response Time value') }]} style={{ width: 140 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 4" />
            </Form.Item>

            <Form.Item name="response_time_unit" rules={[{ required: true, message: t('sla.enterResponseUnit', 'Please select a unit') }]} style={{ width: 140 }}>
              <Select placeholder={t('sla.selectUnit', 'Unit')}>
                <Select.Option value="minutes">{t('sla.unitMinutes', 'Minutes')}</Select.Option>
                <Select.Option value="hours">{t('sla.unitHours', 'Hours')}</Select.Option>
                <Select.Option value="days">{t('sla.unitDays', 'Days')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Title level={5} style={{ marginTop: 8 }}>{t('sla.completionSla', 'Completion SLA')}</Title>
          <Space style={{ width: '100%' }} size="large" align="start">
            <Form.Item name="completion_time_value" rules={[{ required: true, message: t('sla.enterCompletionValue', 'Please enter Completion Time value') }]} style={{ width: 140 }}>
              <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 8" />
            </Form.Item>

            <Form.Item name="completion_time_unit" rules={[{ required: true, message: t('sla.enterCompletionUnit', 'Please select a unit') }]} style={{ width: 140 }}>
              <Select placeholder={t('sla.selectUnit', 'Unit')}>
                <Select.Option value="minutes">{t('sla.unitMinutes', 'Minutes')}</Select.Option>
                <Select.Option value="hours">{t('sla.unitHours', 'Hours')}</Select.Option>
                <Select.Option value="days">{t('sla.unitDays', 'Days')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
