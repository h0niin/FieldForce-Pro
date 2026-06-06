import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Typography, Space, Tag, Result,
  Skeleton, Alert, Row, Col, Divider,
} from 'antd';
import {
  UserOutlined, LockOutlined, ShopOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { signupMagicLinkApi, type MagicLinkValidation } from '@/api/subscription-magic-links.api';
import { useAuthStore } from '@/store/auth.store';

const { Title, Text, Paragraph } = Typography;

type PageState = 'validating' | 'invalid' | 'ready' | 'submitting' | 'success';

export default function SignupFromMagicLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const token = searchParams.get('token') || '';

  const [pageState, setPageState] = useState<PageState>('validating');
  const [planInfo, setPlanInfo] = useState<MagicLinkValidation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) { setErrorMsg('No signup token found in the link.'); setPageState('invalid'); return; }
    signupMagicLinkApi.validate(token)
      .then((res) => { setPlanInfo(res.data.data!); setPageState('ready'); })
      .catch((err) => {
        const msg = err?.response?.data?.message || 'This link is invalid or has expired.';
        setErrorMsg(msg); setPageState('invalid');
      });
  }, [token]);

  const handleSubmit = async (values: any) => {
    if (values.password !== values.confirm_password) {
      form.setFields([{ name: 'confirm_password', errors: ['Passwords do not match'] }]);
      return;
    }
    setSubmitError('');
    setPageState('submitting');
    try {
      const res = await signupMagicLinkApi.signup({
        token,
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        company_name: values.company_name,
        phone: values.phone,
      });
      const user = res.data?.data?.user;
      if (user) login(user);
      setPageState('success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Registration failed. Please try again.');
      setPageState('ready');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: '#1a1a2e' }}>FieldForce Pro</Title>
          <Text type="secondary">Create your account</Text>
        </div>

        {pageState === 'validating' && (
          <Card><Skeleton active paragraph={{ rows: 6 }} /></Card>
        )}

        {pageState === 'invalid' && (
          <Result
            status="error"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Invalid or Expired Link"
            subTitle={errorMsg}
            extra={<Button onClick={() => navigate('/login')}>Go to Login</Button>}
          />
        )}

        {pageState === 'success' && (
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Account Created!"
            subTitle="Redirecting you to the dashboard..."
          />
        )}

        {(pageState === 'ready' || pageState === 'submitting') && planInfo && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Plan summary card */}
            <Card size="small" style={{ borderColor: '#2563eb', background: '#f0f5ff' }}>
              <Space align="center">
                <div>
                  <Text strong style={{ fontSize: 16 }}>{planInfo.plan_name} Plan</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      ₹{planInfo.price_monthly?.toLocaleString()}/month
                      {planInfo.max_total_users ? ` · Up to ${planInfo.max_total_users} users` : ' · Unlimited users'}
                    </Text>
                  </div>
                  {Array.isArray(planInfo.features) && planInfo.features.length > 0 && (
                    <Space style={{ marginTop: 6 }} wrap>
                      {planInfo.features.slice(0, 4).map((f: string) => (
                        <Tag key={f} color="blue" style={{ fontSize: 11 }}>
                          {f.replace(/_/g, ' ')}
                        </Tag>
                      ))}
                    </Space>
                  )}
                </div>
              </Space>
            </Card>

            {/* Registration form */}
            <Card title="Create Your Account">
              {submitError && (
                <Alert message={submitError} type="error" showIcon style={{ marginBottom: 16 }} closable onClose={() => setSubmitError('')} />
              )}

              <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
                <Form.Item name="company_name" label="Company Name" rules={[{ required: true, message: 'Required' }]}>
                  <Input prefix={<ShopOutlined />} placeholder="Your company name" size="large" />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="first_name" label="First Name" rules={[{ required: true, message: 'Required' }]}>
                      <Input prefix={<UserOutlined />} placeholder="First name" size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="last_name" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="Last name" size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="email"
                  label="Work Email"
                  rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
                >
                  <Input placeholder="you@company.com" size="large" />
                </Form.Item>

                <Form.Item name="phone" label="Phone (optional)">
                  <Input placeholder="+91 98765 43210" size="large" />
                </Form.Item>

                <Divider />

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Create a password" size="large" />
                </Form.Item>

                <Form.Item
                  name="confirm_password"
                  label="Confirm Password"
                  rules={[{ required: true, message: 'Please confirm your password' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Repeat password" size="large" />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={pageState === 'submitting'}
                  >
                    Create Account &amp; Get Started
                  </Button>
                </Form.Item>
              </Form>

              <Paragraph type="secondary" style={{ fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
                By creating an account you agree to the Terms of Service and Privacy Policy.
              </Paragraph>
            </Card>
          </Space>
        )}
      </div>
    </div>
  );
}
