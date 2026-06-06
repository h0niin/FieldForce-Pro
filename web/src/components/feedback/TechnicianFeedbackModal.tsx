import React from 'react';
import { Modal, Form, Input, Rate, Switch, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateFeedback } from '@/hooks/use-feedback';

interface TechnicianFeedbackModalProps {
  workOrderId: string;
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function TechnicianFeedbackModal({
  workOrderId,
  open,
  onCancel,
  onSuccess,
}: TechnicianFeedbackModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { mutate: createFeedback, isPending } = useCreateFeedback();

  const handleFinish = (values: { rating: number; comments?: string; is_customer_facing?: boolean }) => {
    createFeedback(
      { work_order_id: workOrderId, ...values },
      {
        onSuccess: () => {
          form.resetFields();
          onSuccess();
        },
      }
    );
  };

  return (
    <Modal
      title={t('technicianFeedbackModal.title')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okText={t('technicianFeedbackModal.submitFeedback')}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ is_customer_facing: false }}
      >
        <Form.Item
          name="rating"
          label={t('technicianFeedbackModal.rating')}
          rules={[{ required: true, message: t('technicianFeedbackModal.pleaseProvideRating') }]}
        >
          <Rate allowHalf />
        </Form.Item>

        <Form.Item name="comments" label={t('technicianFeedbackModal.comments')}>
          <Input.TextArea rows={4} placeholder={t('technicianFeedbackModal.notesPlaceholder')} />
        </Form.Item>

        <Form.Item
          name="is_customer_facing"
          label={t('technicianFeedbackModal.shareWithCustomer')}
          valuePropName="checked"
          tooltip={t('technicianFeedbackModal.shareTooltip')}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}