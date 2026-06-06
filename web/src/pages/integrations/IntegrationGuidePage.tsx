import { Typography, Card, Space, Tag, Alert, Divider, Tabs } from 'antd';
import { ApiOutlined, KeyOutlined, CodeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';

const { Title, Text, Paragraph } = Typography;

const ENDPOINT = 'POST /service-requests/inbound';
const BASE_URL = 'https://api.yourfieldforce.com';

const curlExample = `curl -X POST ${BASE_URL}/service-requests/inbound \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: fk_live_<your_api_key>" \\
  -d '{
    "subject": "AC unit not cooling",
    "description": "The central AC unit stopped cooling on the 3rd floor.",
    "priority": "high",
    "category": "HVAC",
    "customer_email": "john.doe@example.com",
    "customer_name": "John Doe",
    "customer_phone": "+1-555-0100",
    "service_address": "123 Main St, New York, NY 10001",
    "external_ref_id": "TICKET-4821"
  }'`;

const jsExample = `const response = await fetch('${BASE_URL}/service-requests/inbound', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'fk_live_<your_api_key>',
  },
  body: JSON.stringify({
    subject: 'AC unit not cooling',
    description: 'The central AC unit stopped cooling on the 3rd floor.',
    priority: 'high',
    category: 'HVAC',
    customer_email: 'john.doe@example.com',
    customer_name: 'John Doe',
    customer_phone: '+1-555-0100',
    service_address: '123 Main St, New York, NY 10001',
    external_ref_id: 'TICKET-4821',
  }),
});

const result = await response.json();
console.log(result.data.request_number); // e.g. "SR-ABC-20260527-001"`;

const pythonExample = `import requests

response = requests.post(
    '${BASE_URL}/service-requests/inbound',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'fk_live_<your_api_key>',
    },
    json={
        'subject': 'AC unit not cooling',
        'description': 'The central AC unit stopped cooling on the 3rd floor.',
        'priority': 'high',
        'category': 'HVAC',
        'customer_email': 'john.doe@example.com',
        'customer_name': 'John Doe',
        'customer_phone': '+1-555-0100',
        'service_address': '123 Main St, New York, NY 10001',
        'external_ref_id': 'TICKET-4821',
    }
)

data = response.json()
print(data['data']['request_number'])  # e.g. "SR-ABC-20260527-001"`;

const successResponse = `{
  "statusCode": 201,
  "status": true,
  "message": "Service request received successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "request_number": "SR-ABC-20260527-001",
    "subject": "AC unit not cooling",
    "status": "new",
    "priority": "high",
    "channel": "api",
    "external_ref_id": "TICKET-4821",
    "created_at": "2026-05-27T10:00:00.000Z"
  }
}`;

interface Field {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

const fields: Field[] = [
  { name: 'subject', type: 'string', required: true, description: 'Short title of the service request' },
  { name: 'description', type: 'string', required: false, description: 'Detailed description of the issue' },
  { name: 'priority', type: 'low | medium | high | urgent', required: false, description: 'Request priority (default: medium)' },
  { name: 'category', type: 'string', required: false, description: 'Service category (e.g. HVAC, Plumbing)' },
  { name: 'customer_email', type: 'string (email)', required: false, description: 'Customer email — used to find or create a contact record' },
  { name: 'customer_name', type: 'string', required: false, description: 'Customer full name' },
  { name: 'customer_phone', type: 'string', required: false, description: 'Customer phone number' },
  { name: 'service_address', type: 'string', required: false, description: 'Full service address' },
  { name: 'lat', type: 'number', required: false, description: 'Latitude for the service location' },
  { name: 'lng', type: 'number', required: false, description: 'Longitude for the service location' },
  { name: 'external_ref_id', type: 'string', required: false, description: 'Your internal ticket/reference ID for deduplication' },
  { name: 'custom_fields', type: 'object', required: false, description: 'Any additional key-value data to attach to the request' },
];

const codeStyle: React.CSSProperties = {
  background: '#1e1e1e',
  color: '#d4d4d4',
  borderRadius: 8,
  padding: '16px 20px',
  fontFamily: 'monospace',
  fontSize: 13,
  overflowX: 'auto',
  whiteSpace: 'pre',
  display: 'block',
  lineHeight: 1.6,
};

export default function IntegrationGuidePage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('integrationGuide.title')}
        subtitle={t('integrationGuide.subtitle')}
      />

      <Alert
        type="info"
        icon={<KeyOutlined />}
        showIcon
        message={t('integrationGuide.authentication')}
        description={
          <>
            {t('integrationGuide.authDescriptionPrefix')} <Text code>x-api-key</Text> {t('integrationGuide.authDescriptionSuffix')} <Text strong>{t('integrationGuide.authNavigation')}</Text> {t('integrationGuide.authDescriptionEnd')}
          </>
        }
        style={{ marginBottom: 24 }}
      />

      {/* Endpoint */}
      <Card style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 12 }}>
          <ApiOutlined style={{ fontSize: 20, color: '#1677ff' }} />
          <Title level={4} style={{ margin: 0 }}>{t('integrationGuide.inboundEndpoint')}</Title>
        </Space>
        <Space size="middle">
          <Tag color="green" style={{ fontSize: 14, padding: '2px 10px' }}>POST</Tag>
          <code style={{ fontSize: 14 }}>{ENDPOINT}</code>
        </Space>
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          {t('integrationGuide.endpointDescription')}
        </Paragraph>
      </Card>

      {/* Request Body Fields */}
      <Card
        title={<Space><CodeOutlined /> {t('integrationGuide.requestBodyFields')}</Space>}
        style={{ marginBottom: 24 }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {[t('integrationGuide.field'), t('integrationGuide.type'), t('integrationGuide.required'), t('integrationGuide.description')].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => (
                <tr key={field.name} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                    <code>{field.name}</code>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                    {field.type}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                    {field.required
                      ? <Tag color="red">{t('integrationGuide.requiredStatus')}</Tag>
                      : <Tag color="default">{t('integrationGuide.optionalStatus')}</Tag>}
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                    {field.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Code Examples */}
      <Card
        title={<Space><CodeOutlined /> {t('integrationGuide.codeExamples')}</Space>}
        style={{ marginBottom: 24 }}
      >
        <Tabs
          items={[
            {
              key: 'curl',
              label: 'cURL',
              children: <code style={codeStyle}>{curlExample}</code>,
            },
            {
              key: 'js',
              label: 'JavaScript',
              children: <code style={codeStyle}>{jsExample}</code>,
            },
            {
              key: 'python',
              label: 'Python',
              children: <code style={codeStyle}>{pythonExample}</code>,
            },
          ]}
        />
      </Card>

      {/* Success Response */}
      <Card title={t('integrationGuide.successResponse')} style={{ marginBottom: 24 }}>
        <code style={codeStyle}>{successResponse}</code>
      </Card>

      <Divider />

      {/* Error Codes */}
      <Card title={t('integrationGuide.errorCodes')}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {[t('integrationGuide.status'), t('integrationGuide.reason')].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['401 Unauthorized', t('integrationGuide.error401')],
                ['400 Bad Request', t('integrationGuide.error400')],
                ['422 Unprocessable Entity', t('integrationGuide.error422')],
                ['500 Internal Server Error', t('integrationGuide.error500')],
              ].map(([code, reason], i) => (
                <tr key={code} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                    <Tag color={code.startsWith('4') ? 'orange' : 'red'}>{code}</Tag>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}