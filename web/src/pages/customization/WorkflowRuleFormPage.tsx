import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useWorkflowRule, useCreateWorkflowRule, useUpdateWorkflowRule } from '@/hooks/use-workflow-rules';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

const MODULES = [
  { value: 'work_orders', label: 'Work Orders' },
  { value: 'service_requests', label: 'Service Requests' },
  { value: 'estimates', label: 'Estimates' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'companies', label: 'Companies' },
  { value: 'assets', label: 'Assets' },
];

const TRIGGER_EVENTS = [
  { value: 'create', label: 'On Create' },
  { value: 'update', label: 'On Update' },
  { value: 'delete', label: 'On Delete' },
  { value: 'status_change', label: 'On Status Change' },
  { value: 'field_change', label: 'On Field Change' },
  { value: 'scheduled', label: 'Scheduled' },
];

export default function WorkflowRuleFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: workflowRule, isLoading } = useWorkflowRule(id!);
  const createWorkflowRule = useCreateWorkflowRule();
  const updateWorkflowRule = useUpdateWorkflowRule();

  useEffect(() => {
    if (workflowRule) {
      form.setFieldsValue({
        name: workflowRule.name,
        module: workflowRule.module,
        trigger_event: workflowRule.trigger_event,
        conditions: typeof workflowRule.conditions === 'string' ? workflowRule.conditions : JSON.stringify(workflowRule.conditions, null, 2),
        actions: typeof workflowRule.actions === 'string' ? workflowRule.actions : JSON.stringify(workflowRule.actions, null, 2),
        is_active: workflowRule.is_active,
      });
    }
  }, [workflowRule, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      conditions: values.conditions ? JSON.parse(values.conditions as string) : {},
      actions: values.actions ? JSON.parse(values.actions as string) : {},
    };

    try {
      if (isEdit) {
        await updateWorkflowRule.mutateAsync({ id: id!, ...payload });
      } else {
        await createWorkflowRule.mutateAsync(payload as never);
      }
      navigate('/customization/workflow-rules');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('workflowRuleForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('workflowRuleForm.editTitle') : t('workflowRuleForm.createTitle')}
        onBack={() => navigate('/customization/workflow-rules')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_active: true, conditions: '{}', actions: '{}' }}
        >
          <Form.Item
            name="name"
            label={t('workflowRuleForm.name')}
            rules={[{ required: true, message: t('workflowRuleForm.nameRequired') }]}
          >
            <Input placeholder={t('workflowRuleForm.namePlaceholder')} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="module"
              label={t('workflowRuleForm.module')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('workflowRuleForm.moduleRequired') }]}
            >
              <Select
                placeholder={t('workflowRuleForm.selectModule')}
                options={MODULES}
              />
            </Form.Item>
            <Form.Item
              name="trigger_event"
              label={t('workflowRuleForm.triggerEvent')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('workflowRuleForm.triggerRequired') }]}
            >
              <Select
                placeholder={t('workflowRuleForm.selectTrigger')}
                options={TRIGGER_EVENTS}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="conditions"
            label={t('workflowRuleForm.conditionsJson')}
            rules={[
              { required: true, message: t('workflowRuleForm.conditionsRequired') },
              {
                validator: (_, value) => {
                  try {
                    if (value) JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('workflowRuleForm.invalidJson')));
                  }
                },
              },
            ]}
            extra={t('workflowRuleForm.conditionsHint')}
          >
            <TextArea
              rows={6}
              placeholder='{"field": "priority", "operator": "equals", "value": "urgent"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="actions"
            label={t('workflowRuleForm.actionsJson')}
            rules={[
              { required: true, message: t('workflowRuleForm.actionsRequired') },
              {
                validator: (_, value) => {
                  try {
                    if (value) JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('workflowRuleForm.invalidJson')));
                  }
                },
              },
            ]}
            extra={t('workflowRuleForm.actionsHint')}
          >
            <TextArea
              rows={6}
              placeholder='{"action": "send_email", "to": "manager@example.com", "template": "urgent_wo_notification"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="is_active" label={t('workflowRuleForm.active')} valuePropName="checked">
            <Switch checkedChildren={t('workflowRuleForm.active')} unCheckedChildren={t('workflowRuleForm.inactive')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createWorkflowRule.isPending || updateWorkflowRule.isPending}
              >
                {isEdit ? t('workflowRuleForm.update') : t('workflowRuleForm.create')}
              </Button>
              <Button onClick={() => navigate('/customization/workflow-rules')}>{t('workflowRuleForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}