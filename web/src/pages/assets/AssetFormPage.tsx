import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, DatePicker, InputNumber, Select, Row, Col, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAsset, useCreateAsset, useUpdateAsset, useAssets } from '@/hooks/use-assets';
import { useContactsByCompany } from '@/hooks/use-contacts';
import { useCompanies } from '@/hooks/use-companies';
import { useServiceLocationsByCompany } from '@/hooks/use-service-locations';
import PageHeader from '@/components/common/PageHeader';
import CustomFieldsSection from '@/components/common/CustomFieldsSection';
import { formatEnumText } from '@/utils/string';

const { TextArea } = Input;

export default function AssetFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const assetQuery = useAsset(id!);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  
  const { data: companiesData } = useCompanies({ take: 100 });
  const companies = companiesData?.data || [];

  const { data: contacts } = useContactsByCompany(selectedCompanyId);
  const { data: locations } = useServiceLocationsByCompany(selectedCompanyId || '');
  const { data: assetsQuery } = useAssets({ take: 100 });

  useEffect(() => {
    if (isEdit && assetQuery.isSuccess && assetQuery.data) {
      // Account for potential nested data wrappers
      const assetData = (assetQuery.data as any)?.data?.data || (assetQuery.data as any)?.data || assetQuery.data;
      if (assetData) {
        setSelectedCompanyId(assetData.company_id);
        form.setFieldsValue({
          name: assetData.name,
          model: assetData.model,
          serial_number: assetData.serial_number,
          manufacturer: assetData.manufacturer,
          installation_date: assetData.installation_date ? dayjs(assetData.installation_date) : null,
          warranty_expiry: assetData.warranty_expiry ? dayjs(assetData.warranty_expiry) : null,
          ordered_date: assetData.ordered_date ? dayjs(assetData.ordered_date) : null,
          purchased_date: assetData.purchased_date ? dayjs(assetData.purchased_date) : null,
          giai: assetData.giai,
          product_category: assetData.product_category,
          company_id: assetData.company_id,
          contact_id: assetData.contact_id,
          service_location_id: assetData.service_location_id,
          parent_asset_id: assetData.parent_asset_id,
          notes: assetData.notes,
          status: assetData.status || 'OPERATIONAL',
          custom_fields: assetData.custom_fields || {},
        });
      }
    }
  }, [isEdit, assetQuery.isSuccess, assetQuery.data, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      installation_date: values.installation_date ? (values.installation_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      warranty_expiry: values.warranty_expiry ? (values.warranty_expiry as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      ordered_date: values.ordered_date ? (values.ordered_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      purchased_date: values.purchased_date ? (values.purchased_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
    };

    try {
      if (isEdit) {
        await updateAsset.mutateAsync({ id: id!, ...payload });
      } else {
        await createAsset.mutateAsync(payload as any);
      }
      navigate('/assets');
    } catch {
      // Error handled by mutation hooks
    }
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    form.setFieldsValue({ contact_id: null, service_location_id: null });
  };

  if (isEdit && assetQuery.isLoading) {
    return (
      <div>
        <PageHeader title={t('assetForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('assetForm.editAsset') : t('assetForm.createAsset')}
        onBack={() => navigate('/assets')}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Asset Details" style={{ marginBottom: 24 }}>
              <Form.Item name="name" label={t('assetForm.assetName')} rules={[{ required: true, message: t('assetForm.enterAssetName') }]}>
                <Input placeholder={t('assetForm.placeholderAssetName')} />
              </Form.Item>

              <Form.Item name="notes" label="Description">
                <TextArea rows={3} placeholder="Enter asset description" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="manufacturer" label={t('assetForm.manufacturer')}>
                    <Input placeholder={t('assetForm.placeholderManufacturer')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="model" label={t('assetForm.model')}>
                    <Input placeholder={t('assetForm.placeholderModel')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="serial_number" label={t('assetForm.serialNumber')}>
                    <Input placeholder={t('assetForm.placeholderSerialNumber')} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="giai" label="GIAI (Global Individual Asset Identifier)">
                    <Input placeholder="Enter GIAI" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="product_category" label="Service And Part" rules={[{ required: true, message: 'Please select a product category' }]}>
                    <Select placeholder="Select product category" allowClear>
                      <Select.Option value="HVAC">HVAC Unit</Select.Option>
                      <Select.Option value="Plumbing">Plumbing Part</Select.Option>
                      <Select.Option value="Electrical">Electrical Component</Select.Option>
                      <Select.Option value="Appliance">Appliance</Select.Option>
                      <Select.Option value="Security">Security System</Select.Option>
                      <Select.Option value="Fire Safety">Fire Safety Equipment</Select.Option>
                      <Select.Option value="Elevator">Elevator</Select.Option>
                      <Select.Option value="Generator">Generator</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="parent_asset_id" label="Parent Asset">
                    <Select
                      placeholder="Select parent asset"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={(assetsQuery as any)?.data?.data?.map((asset: any) => ({ value: asset.id, label: asset.name })) || (assetsQuery as any)?.data?.map((asset: any) => ({ value: asset.id, label: asset.name })) || []}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
                    <Select placeholder="Select status">
                      {['OPERATIONAL', 'NEEDS_REPAIR', 'IN_REPAIR', 'DECOMMISSIONED'].map((status) => (
                        <Select.Option key={status} value={status}>
                          {formatEnumText(status)}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Dates & Metrics</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="ordered_date" label="Ordered Date">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="purchased_date" label="Purchased Date">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="installation_date" label="Installation Date">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="warranty_expiry" label="Warranty Expiry">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            <Card title="Additional Information" style={{ marginBottom: 24 }}>
              <CustomFieldsSection moduleName="Assets" />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Contact Details" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="company_id" label="Company" rules={[{ required: true, message: 'Please select a company' }]}>
                    <Select
                      placeholder="Select a company"
                      onChange={handleCompanyChange}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={companies.map((c) => ({ value: c.id, label: c.name }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contact_id" label="Contact" rules={[{ required: true, message: 'Please select a contact' }]}>
                    <Select
                      placeholder="Select a contact"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={contacts?.map((c) => ({
                        value: c.id,
                        label: `${c.first_name} ${c.last_name}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Address Details" style={{ marginBottom: 24 }}>
              <Form.Item name="service_location_id" label="Service Location">
                <Select
                  placeholder="Select a service location"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  disabled={!selectedCompanyId}
                  options={locations?.map((l) => ({
                    value: l.id,
                    label: l.address,
                  })) || []}
                />
              </Form.Item>
            </Card>

            <Card>
              <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate('/assets')}>{t('assetForm.cancel')}</Button>
                <Button type="primary" htmlType="submit" loading={createAsset.isPending || updateAsset.isPending}>
                  {isEdit ? t('assetForm.update') : t('assetForm.create')}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}