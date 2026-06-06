import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCompany, useCreateCompany, useUpdateCompany } from '@/hooks/use-companies';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function CompanyFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: company, isLoading } = useCompany(id!);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  useEffect(() => {
    if (company) {
      form.setFieldsValue({
        name: company.name,
        industry: company.industry,
        billing_address: company.billing_address,
        tax_id: company.tax_id,
        website: company.website,
        notes: company.notes,
      });
    }
  }, [company, form]);

  const handleSubmit = async (values: any) => {
    try {
      if (isEdit) {
        await updateCompany.mutateAsync({ id: id!, ...values });
      } else {
        await createCompany.mutateAsync(values);
      }
      navigate('/companies');
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('companyForm.loading')} />
        <Card>
          <Skeleton active />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('companyForm.editCompany') : t('companyForm.createCompany')}
        onBack={() => navigate('/companies')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label={t('companyForm.companyName')}
            rules={[{ required: true, message: t('companyForm.pleaseEnterCompanyName') }]}
          >
            <Input placeholder={t('companyForm.companyNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="industry"
            label={t('companyForm.industry')}
          >
            <Input placeholder={t('companyForm.industryPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="tax_id"
            label={t('companyForm.taxId')}
          >
            <Input placeholder={t('companyForm.taxIdPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="website"
            label={t('companyForm.website')}
            rules={[{ type: 'url', message: t('companyForm.pleaseEnterValidUrl') }]}
          >
            <Input placeholder={t('companyForm.websitePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="billing_address"
            label={t('companyForm.billingAddress')}
          >
            <TextArea rows={3} placeholder={t('companyForm.billingAddressPlaceholder')} />
          </Form.Item>

          <Form.Item name="notes" label={t('companyForm.notes')}>
            <TextArea rows={4} placeholder={t('companyForm.notesPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createCompany.isPending || updateCompany.isPending}
              >
                {isEdit ? t('companyForm.update') : t('companyForm.create')}
              </Button>
              <Button onClick={() => navigate('/companies')}>{t('companyForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}