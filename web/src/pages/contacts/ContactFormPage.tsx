import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Select, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContact, useCreateContact, useUpdateContact } from '@/hooks/use-contacts';
import { useCompanies } from '@/hooks/use-companies';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function ContactFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: contact, isLoading } = useContact(id!);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (contact) {
      form.setFieldsValue({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        service_address: contact.service_address,
        billing_address: contact.billing_address,
        company_id: contact.company_id,
        tags: contact.tags || [],
      });
    }
  }, [contact, form]);

  const { data: companiesData } = useCompanies({ take: 100 });
  const companies = companiesData?.data || [];

  const handleSubmit = async (values: any) => {
    try {
      if (isEdit) {
        await updateContact.mutateAsync({ id: id!, ...values });
      } else {
        await createContact.mutateAsync(values);
      }
      navigate('/contacts');
    } catch (error) {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('contactForm.loading')} />
        <Card>
          <Skeleton active />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('contactForm.editContact') : t('contactForm.createContact')}
        onBack={() => navigate('/contacts')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="first_name"
            label={t('contactForm.firstName')}
            rules={[{ required: true, message: t('contactForm.pleaseEnterFirstName') }]}
          >
            <Input placeholder={t('contactForm.johnPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="last_name"
            label={t('contactForm.lastName')}
            rules={[{ required: true, message: t('contactForm.pleaseEnterLastName') }]}
          >
            <Input placeholder={t('contactForm.doePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="email"
            label={t('contactForm.email')}
            rules={[{ type: 'email', message: t('contactForm.pleaseEnterValidEmail') }]}
          >
            <Input placeholder={t('contactForm.emailPlaceholder')} />
          </Form.Item>

          <Form.Item name="phone" label={t('contactForm.phone')}>
            <Input placeholder={t('contactForm.phonePlaceholder')} />
          </Form.Item>

          <Form.Item name="company_id" label="Company" rules={[{ required: true, message: 'Please select a company' }]}>
            <Select
              placeholder="Select a company"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {companies.map((company) => (
                <Select.Option key={company.id} value={company.id}>
                  {company.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="service_address" label="Service Address">
            <TextArea rows={2} placeholder="Enter service address" />
          </Form.Item>

          <Form.Item name="billing_address" label="Billing Address">
            <TextArea rows={2} placeholder="Enter billing address" />
          </Form.Item>

          <Form.Item name="tags" label={t('contactForm.tags')}>
            <Select
              mode="tags"
              placeholder={t('contactForm.tagsPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createContact.isPending || updateContact.isPending}
              >
                {isEdit ? t('contactForm.update') : t('contactForm.create')}
              </Button>
              <Button onClick={() => navigate('/contacts')}>{t('contactForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}