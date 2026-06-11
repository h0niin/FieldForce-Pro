import React from 'react';
import { Form, Input, InputNumber, Select, Checkbox, DatePicker, Typography, Row, Col } from 'antd';
import { useCustomFieldsByModule } from '@/hooks/use-custom-fields';

const { Title } = Typography;
const { TextArea } = Input;

interface Props {
  moduleName: string;
}

export default function CustomFieldsSection({ moduleName }: Props) {
  const { data: customFields, isLoading } = useCustomFieldsByModule(moduleName);

  if (isLoading || !customFields || customFields.length === 0) {
    return null;
  }

  // Filter out system fields and invisible fields
  const activeFields = customFields.filter((cf: any) => !cf.is_system && cf.is_visible !== false);

  if (activeFields.length === 0) {
    return null;
  }

  // Group by section_name
  const sections: Record<string, typeof activeFields> = {};
  activeFields.forEach((cf: any) => {
    const sectionName = cf.section_name || 'Additional Information';
    if (!sections[sectionName]) sections[sectionName] = [];
    sections[sectionName].push(cf);
  });

  const renderFieldInput = (type: string, options: any) => {
    switch (type) {
      case 'textarea':
        return <TextArea rows={3} />;
      case 'number':
        return <InputNumber style={{ width: '100%' }} />;
      case 'currency':
        return <InputNumber prefix="$" precision={2} style={{ width: '100%' }} />;
      case 'percentage':
        return <InputNumber suffix="%" max={100} style={{ width: '100%' }} />;
      case 'phone':
      case 'email':
      case 'url':
        return <Input type={type} />;
      case 'date':
        return <DatePicker style={{ width: '100%' }} />;
      case 'datetime':
        return <DatePicker showTime style={{ width: '100%' }} />;
      case 'checkbox':
        return <Checkbox />;
      case 'dropdown':
      case 'multi_select': {
        const selectOptions = Array.isArray(options?.choices)
          ? options.choices.map((c: string) => ({ label: c, value: c }))
          : [];
        return <Select mode={type === 'multi_select' ? 'multiple' : undefined} options={selectOptions} allowClear />;
      }
      default:
        return <Input />;
    }
  };

  return (
    <>
      {Object.entries(sections)
        .sort((a, b) => (a[1][0]?.section_order || 0) - (b[1][0]?.section_order || 0))
        .map(([sectionName, fields]) => (
          <div key={sectionName} style={{ marginTop: 32 }}>
            <Title level={5} style={{ marginBottom: 16 }}>{sectionName}</Title>
            <Row gutter={24}>
              {fields
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((cf: any) => (
                <Col span={12} key={cf.field_name}>
                  <Form.Item
                    name={['custom_fields', cf.field_name]}
                    label={cf.field_label || cf.field_name}
                    valuePropName={cf.field_type === 'checkbox' ? 'checked' : 'value'}
                    rules={[{ required: cf.is_required, message: `${cf.field_label || cf.field_name} is required` }]}
                  >
                    {renderFieldInput(cf.field_type, cf.options)}
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </div>
        ))}
    </>
  );
}
