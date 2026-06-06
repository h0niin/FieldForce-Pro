import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Form, Input, Button, Space, Skeleton, Select, Rate } from 'antd';
import { useReview, useCreateReview, useUpdateReview } from '@/hooks/use-reviews';
import { useAllWorkOrders } from '@/hooks/use-work-orders';
import { useAllContacts } from '@/hooks/use-contacts';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function ReviewFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: review, isLoading } = useReview(id!);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const { data: workOrders } = useAllWorkOrders();
  const { data: contacts } = useAllContacts();

  useEffect(() => {
    if (review) {
      form.setFieldsValue({
        work_order_id: review.work_order_id,
        contact_id: review.contact_id,
        rating: review.rating,
        comment: review.comment,
        platform: review.platform,
      });
    }
  }, [review, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit) {
        await updateReview.mutateAsync({ id: id!, ...values });
      } else {
        await createReview.mutateAsync(values as never);
      }
      navigate('/reviews');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('reviewForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('reviewForm.editReview') : t('reviewForm.createReview')}
        onBack={() => navigate('/reviews')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ platform: 'internal' }}
        >
          <Form.Item
            name="work_order_id"
            label={t('reviewForm.workOrder')}
            rules={[{ required: true, message: t('reviewForm.pleaseSelectWorkOrder') }]}
          >
            <Select
              placeholder={t('reviewForm.selectWorkOrder')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={workOrders?.map((wo) => ({
                value: wo.id,
                label: `${wo.wo_number || 'WO'} - ${wo.summary}`,
              })) || []}
            />
          </Form.Item>

          <Form.Item
            name="contact_id"
            label={t('reviewForm.customerContact')}
            rules={[{ required: true, message: t('reviewForm.pleaseSelectContact') }]}
          >
            <Select
              placeholder={t('reviewForm.selectCustomer')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={contacts?.map((c) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
              })) || []}
            />
          </Form.Item>

          <Form.Item
            name="rating"
            label={t('reviewForm.rating')}
            rules={[{ required: true, message: t('reviewForm.pleaseProvideRating') }]}
          >
            <Rate allowHalf />
          </Form.Item>

          <Form.Item
            name="comment"
            label={t('reviewForm.comment')}
            rules={[{ required: true, message: t('reviewForm.pleaseEnterComment') }]}
          >
            <TextArea rows={4} placeholder={t('reviewForm.writeReviewHere')} />
          </Form.Item>

          <Form.Item
            name="platform"
            label={t('reviewForm.platform')}
            rules={[{ required: true, message: t('reviewForm.pleaseSelectPlatform') }]}
          >
            <Select placeholder={t('reviewForm.selectPlatform')}>
              <Select.Option value="internal">{t('reviewForm.platforms.internal')}</Select.Option>
              <Select.Option value="google">{t('reviewForm.platforms.google')}</Select.Option>
              <Select.Option value="yelp">{t('reviewForm.platforms.yelp')}</Select.Option>
              <Select.Option value="facebook">{t('reviewForm.platforms.facebook')}</Select.Option>
              <Select.Option value="other">{t('reviewForm.platforms.other')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createReview.isPending || updateReview.isPending}
              >
                {isEdit ? t('reviewForm.update') : t('reviewForm.submitReview')}
              </Button>
              <Button onClick={() => navigate('/reviews')}>{t('reviewForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}