import { Form, Input, Button, Card, Switch, Spin, Row, Col, Select, Divider, Typography } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useTenant, useUpdateTenant } from '@/hooks/use-tenants';
import PageHeader from '@/components/common/PageHeader';
import { useEffect, useMemo } from 'react';

const { Title } = Typography;

type SettingsForm = {
  name: string;
  domain?: string;
  is_active: boolean;
  industry?: string;
  website?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  location?: string;
  timezone?: string;
  date_format?: string;
  time_format?: string;
  distance_unit?: string;
};

const INDUSTRIES = [
  { label: 'HVAC Services', value: 'HVAC Services' },
  { label: 'Electrical Contracting', value: 'Electrical Contracting' },
  { label: 'Plumbing & Heating', value: 'Plumbing & Heating' },
  { label: 'Telecommunications', value: 'Telecommunications' },
  { label: 'General Construction', value: 'General Construction' },
  { label: 'Landscaping & Gardening', value: 'Landscaping & Gardening' },
  { label: 'Pest Control', value: 'Pest Control' },
  { label: 'Other Services', value: 'Other' },
];

const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  { label: 'GMT', value: 'GMT' },
  { label: 'US/Eastern (EST/EDT)', value: 'US/Eastern' },
  { label: 'US/Central (CST/CDT)', value: 'US/Central' },
  { label: 'US/Mountain (MST/MDT)', value: 'US/Mountain' },
  { label: 'US/Pacific (PST/PDT)', value: 'US/Pacific' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Australia/Sydney (AEST/AEDT)', value: 'Australia/Sydney' },
];

const DATE_FORMATS = [
  { label: 'YYYY-MM-DD (2026-06-08)', value: 'YYYY-MM-DD' },
  { label: 'DD/MM/YYYY (08/06/2026)', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY (06/08/2026)', value: 'MM/DD/YYYY' },
];

const TIME_FORMATS = [
  { label: '12-Hour Clock (12:00 PM)', value: '12-hour' },
  { label: '24-Hour Clock (12:00)', value: '24-hour' },
];

const DISTANCE_UNITS = [
  { label: 'Miles (mi)', value: 'mi' },
  { label: 'Kilometers (km)', value: 'km' },
];

export default function GeneralSettingsPage() { 
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: tenant, isLoading } = useTenant(user?.tenant_id || '');
  const updateMutation = useUpdateTenant();


  const schema = useMemo(() => 
    z.object({
      name: z.string().min(1, t('settings.nameRequired')),
      domain: z.string().optional().or(z.literal('')),
      is_active: z.boolean(),
      industry: z.string().optional().or(z.literal('')),
      website: z.string().optional().or(z.literal('')),
      phone: z.string().optional().or(z.literal('')),
      mobile: z.string().optional().or(z.literal('')),
      fax: z.string().optional().or(z.literal('')),
      location: z.string().optional().or(z.literal('')),
      timezone: z.string().optional().or(z.literal('')),
      date_format: z.string().optional().or(z.literal('')),
      time_format: z.string().optional().or(z.literal('')),
      distance_unit: z.string().optional().or(z.literal('')),
    }),
    [t]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      domain: '',
      is_active: true,
      industry: '',
      website: '',
      phone: '',
      mobile: '',
      fax: '',
      location: '',
      timezone: 'UTC',
      date_format: 'YYYY-MM-DD',
      time_format: '12-hour',
      distance_unit: 'mi',
    },
  });

  useEffect(() => {
    if (tenant) {
      const tenantSettings = (tenant.settings as Record<string, any>) || {};
      reset({
        name: tenant.name,
        domain: tenant.domain || '',
        is_active: tenant.is_active,
        industry: tenantSettings.industry || '',
        website: tenantSettings.website || '',
        phone: tenantSettings.phone || '',
        mobile: tenantSettings.mobile || '',
        fax: tenantSettings.fax || '',
        location: tenantSettings.location || '',
        timezone: tenantSettings.timezone || 'UTC',
        date_format: tenantSettings.date_format || 'YYYY-MM-DD',
        time_format: tenantSettings.time_format || '12-hour',
        distance_unit: tenantSettings.distance_unit || 'mi',
      });
    }
  }, [tenant, reset]);

  const onSubmit = (data: SettingsForm) => {
    if (!tenant) return;

    const mergedSettings = {
      ...(tenant.settings || {}),
      industry: data.industry,
      website: data.website,
      phone: data.phone,
      mobile: data.mobile,
      fax: data.fax,
      location: data.location,
      timezone: data.timezone,
      date_format: data.date_format,
      time_format: data.time_format,
      distance_unit: data.distance_unit,
    };

    updateMutation.mutate({
      id: tenant.id,
      name: data.name,
      domain: data.domain,
      is_active: data.is_active,
      settings: mergedSettings,
    });
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          {t('settings.orgProfile.title', 'Organization Profile')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Configure your organization's core business details, physical address, contact records, and regional locale configurations to maintain consistent and professional branding across all dynamic documents, including Estimates, Invoices, and Service Reports.
        </p>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {/* Section 1: Business Profile */}
        <Title level={5} style={{ marginTop: 0, fontWeight: 600 }}>
          {t('settings.sections.businessInfo', 'Basic Details')}
        </Title>
        <Divider style={{ margin: '8px 0 16px 0' }} />

        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={t('settings.companyName')}
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Acme Services" />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.industry', 'Industry')}>
              <Controller
                name="industry"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select industry"
                    options={INDUSTRIES}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.customDomain')}>
              <Controller
                name="domain"
                control={control}
                render={({ field }) => <Input {...field} placeholder="acme.fieldforcepro.com" />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.website', 'Website')}>
              <Controller
                name="website"
                control={control}
                render={({ field }) => <Input {...field} placeholder="https://example.com" />}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Section 2: Contact Information */}
        <Title level={5} style={{ marginTop: 16, fontWeight: 600 }}>
          {t('settings.sections.contactInfo', 'Contact Details')}
        </Title>
        <Divider style={{ margin: '8px 0 16px 0' }} />

        <Row gutter={24}>
          <Col xs={24} sm={8}>
            <Form.Item label={t('settings.phone', 'Phone')}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input {...field} placeholder="+1 (555) 019-9234" />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label={t('settings.mobile', 'Mobile')}>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => <Input {...field} placeholder="+1 (555) 019-9235" />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label={t('settings.fax', 'Fax')}>
              <Controller
                name="fax"
                control={control}
                render={({ field }) => <Input {...field} placeholder="+1 (555) 019-9236" />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label={t('settings.location', 'Location / Business Address')}>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                placeholder="123 Business Rd, Suite 100, New York, NY 10001"
                rows={2}
              />
            )}
          />
        </Form.Item>

        {/* Section 3: Localization Preferences */}
        <Title level={5} style={{ marginTop: 16, fontWeight: 600 }}>
          {t('settings.sections.localePreferences', 'Locale Preferences')}
        </Title>
        <Divider style={{ margin: '8px 0 16px 0' }} />

        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.timezone', 'Time Zone')}>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Time Zone"
                    options={TIMEZONES}
                    showSearch
                    optionFilterProp="label"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.distanceUnit', 'Distance Unit')}>
              <Controller
                name="distance_unit"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Distance Unit"
                    options={DISTANCE_UNITS}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.dateFormat', 'Date Format')}>
              <Controller
                name="date_format"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Date Format"
                    options={DATE_FORMATS}
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label={t('settings.timeFormat', 'Time Format')}>
              <Controller
                name="time_format"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Time Format"
                    options={TIME_FORMATS}
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Section 4: System Overrides */}
        <Title level={5} style={{ marginTop: 16, fontWeight: 600 }}>
          {t('settings.sections.systemOverrides', 'System Overrides')}
        </Title>
        <Divider style={{ margin: '8px 0 16px 0' }} />

        <Form.Item label={t('settings.active')}>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={updateMutation.isPending}
            style={{ minWidth: 150, height: 40 }}
          >
            {t('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}