import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Select } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  BankOutlined,
  PhoneOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  RocketOutlined,
  TeamOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  CloseOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/use-auth';
import { useUiStore } from '@/store/ui.store';
import { getPlanPricing, formatPlanPrice, formatFeatureName, SUPPORTED_CURRENCIES } from '@/utils/pricing';
import { usePublicSubscriptionPlans } from '@/hooks/use-auth';

const { Title, Text } = Typography;

// ─── Schemas ─────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Must contain uppercase, lowercase, number, and special character',
    ),
  company_name: z.string().min(1, 'Company name is required').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
});

type Step1Form = z.infer<typeof step1Schema>;
type PlanSlug = 'basic' | 'professional' | 'enterprise';

// ─── Plan definitions ────────────────────────────────────────────────────────
const PLANS: {
  slug: PlanSlug;
  name: string;
  price: string;
  appointments: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    slug: 'basic',
    name: 'Basic',
    price: '₹49',
    appointments: 100,
    icon: <ThunderboltOutlined />,
    color: '#3D55E8',
    gradient: 'linear-gradient(135deg, #3D55E8, #00D8FF)',
    features: ['100 appointments/mo', 'Up to 200 users', 'Work Orders & Scheduling', 'Service Requests', 'Customer Portal', 'Basic Reports'],
  },
  {
    slug: 'professional',
    name: 'Professional',
    price: '₹149',
    appointments: 500,
    icon: <RocketOutlined />,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    features: ['500 appointments/mo', 'Up to 200 users', 'Everything in Basic', 'AI Scheduling & Dispatch', 'Invoices & Payments', 'Advanced Analytics', 'API Access'],
    popular: true,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    price: '₹399',
    appointments: 2000,
    icon: <CrownOutlined />,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    features: ['2000 appointments/mo', 'Up to 200 users', 'Everything in Professional', 'Predictive Maintenance (IoT)', 'Computer Vision QA', 'Custom Integrations', 'Dedicated Support'],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registerMutation = useRegister();
  const { data: plans } = usePublicSubscriptionPlans();

  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const urlPlan = searchParams.get('plan') as PlanSlug | null;
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>(
    urlPlan && ['basic', 'professional', 'enterprise'].includes(urlPlan) ? urlPlan : 'professional',
  );
  const [showCustomModal, setShowCustomModal] = useState(false);
  const currency = useUiStore((s) => s.currency);
  const setCurrency = useUiStore((s) => s.setCurrency);

  // Dynamic Theme state synchronized with Landing Page
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('lp-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('lp-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '', company_name: '', phone: '' },
  });

  const onStep1Submit = (data: Step1Form) => {
    setStep1Data(data);
    setStep(2);
  };

  const onConfirm = () => {
    if (!step1Data) return;
    registerMutation.mutate(
      { ...step1Data, phone: step1Data.phone || undefined, plan_slug: selectedPlan },
      { onSuccess: () => navigate('/dashboard') },
    );
  };

  // Dynamic values based on active theme choice
  const theme = {
    pageBg: isDark
      ? 'linear-gradient(135deg, #070B18 0%, #0C1020 50%, #060910 100%)'
      : 'linear-gradient(135deg, #EEF4FF 0%, #F5F8FF 50%, #E6EEFF 100%)',
    cardBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
    cardBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(34, 51, 204, 0.12)',
    cardShadow: isDark ? '0 32px 64px rgba(0,0,0,0.55)' : '0 32px 64px rgba(34, 51, 204, 0.08)',
    textColor: isDark ? '#E8EEFF' : '#1A2038',
    textMuted: isDark ? '#7B8DB0' : '#4A5578',
    backBtnColor: isDark ? 'rgba(255, 255, 255, 0.5)' : '#3D55E8',
    toggleBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(34, 51, 204, 0.08)',
    labelColor: isDark ? 'rgba(255,255,255,0.75)' : '#4A5578',
    primaryBtnBg: isDark
      ? 'linear-gradient(135deg, #3D55E8 0%, #00D8FF 100%)'
      : 'linear-gradient(135deg, #1A1AE6 0%, #00C8FF 100%)',
    primaryBtnShadow: isDark
      ? '0 8px 24px rgba(61, 85, 232, 0.35)'
      : '0 8px 24px rgba(26, 26, 230, 0.25)',
    planCard: (selected: boolean, planColor: string) => ({
      background: selected
        ? (isDark ? `${planColor}18` : `${planColor}0D`)
        : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.45)'),
      border: selected
        ? `2px solid ${planColor}`
        : (isDark ? '2px solid rgba(255, 255, 255, 0.08)' : '2px solid rgba(34, 51, 204, 0.12)'),
    }),
    planCardCustom: {
      border: isDark ? '2px dashed rgba(255,255,255,0.15)' : '2px dashed rgba(34, 51, 204, 0.25)',
      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)',
    },
    modalOverlayBg: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(7, 11, 24, 0.45)',
    modalBg: isDark ? '#0C1020' : '#ffffff',
    modalBorder: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(34, 51, 204, 0.15)',
    contactItemBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(34, 51, 204, 0.04)',
    contactItemBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(34, 51, 204, 0.1)',
  };

  return (
    <div style={{ ...styles.page, background: theme.pageBg }} className="register-page-container">
      <style>{`
        .register-page-container .ant-input-affix-wrapper {
          background: ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.8)'} !important;
          border-color: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(34, 51, 204, 0.15)'} !important;
        }
        .register-page-container .ant-input-affix-wrapper:hover,
        .register-page-container .ant-input-affix-wrapper-focused {
          border-color: #3D55E8 !important;
          box-shadow: 0 0 0 2px rgba(61, 85, 232, 0.2) !important;
        }
        .register-page-container .ant-input-affix-wrapper .ant-input {
          color: ${isDark ? '#fff' : '#1A2038'} !important;
          background: transparent !important;
        }
        .register-page-container .ant-input {
          background: ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.8)'} !important;
          border-color: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(34, 51, 204, 0.15)'} !important;
          color: ${isDark ? '#fff' : '#1A2038'} !important;
        }
        .register-page-container .ant-input:hover,
        .register-page-container .ant-input:focus {
          border-color: #3D55E8 !important;
          background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)'} !important;
        }
        .register-page-container .ant-input::placeholder,
        .register-page-container .ant-input-affix-wrapper .ant-input::placeholder {
          color: ${isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(74, 85, 120, 0.5)'} !important;
        }
        .register-page-container .ant-input-prefix {
          color: ${isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(74, 85, 120, 0.6)'} !important;
          margin-right: 8px;
        }
        .register-page-container .ant-input-password-icon {
          color: ${isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(74, 85, 120, 0.6)'} !important;
        }
        .register-page-container .ant-input-password-icon:hover {
          color: ${isDark ? '#fff' : '#1A2038'} !important;
        }
        .register-page-container .ant-form-item-explain-error {
          color: #ef4444 !important;
          font-size: 12px;
          margin-top: 4px;
        }
      `}</style>

      {/* ── Glassmorphism card ── */}
      <div style={{ ...styles.card, background: theme.cardBg, border: theme.cardBorder, boxShadow: theme.cardShadow }}>
        
        {/* Toolbar: Theme toggle + Currency toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          {step === 2 ? (
            <button onClick={() => setStep(1)} style={{ ...styles.backBtn, color: theme.backBtnColor }}>
              <ArrowLeftOutlined /> Back
            </button>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Theme selector */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                border: 'none',
                background: theme.toggleBg,
                color: theme.textColor,
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              title="Toggle light/dark theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Currency selector (Step 2 only) */}
            {step === 2 && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Select
                  value={currency}
                  onChange={(val) => setCurrency(val as any)}
                  size="small"
                  style={{ width: 120 }}
                  options={SUPPORTED_CURRENCIES.map((c) => ({
                    label: c.label,
                    value: c.key,
                  }))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={{ ...styles.logoIcon, background: 'linear-gradient(135deg, #3D55E8, #00D8FF)' }}>
            <svg width="16" height="16" viewBox="0 0 512 512" fill="none">
              <path d="M 226,112 L 344,112 A 8,8 0 0,1 351,121 L 297,196 A 4,4 0 0,0 300,202 L 356,202 A 8,8 0 0,1 363,212 L 173,394 A 8,8 0 0,1 160,387 L 218,254 A 4,4 0 0,0 214,248 L 152,248 A 8,8 0 0,1 145,237 L 219,117 A 8,8 0 0,1 226,112 Z" fill="white" />
            </svg>
          </div>
          <span style={{ ...styles.logoText, color: theme.textColor }}>FieldForce Pro</span>
        </div>

        {/* Step indicators */}
        <div style={styles.steps}>
          {[1, 2].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ ...styles.stepDot, background: step >= s ? '#3D55E8' : 'rgba(255,255,255,0.15)' }}>
                {step > s ? <CheckCircleFilled style={{ fontSize: 10 }} /> : s}
              </div>
              <span style={{ ...styles.stepLabel, color: step >= s ? theme.textColor : theme.textMuted }}>
                {s === 1 ? 'Company Details' : 'Choose Plan'}
              </span>
              {s < 2 && <div style={styles.stepLine} />}
            </div>
          ))}
        </div>

        {/* ═══ STEP 1 ═══ */}
        {step === 1 && (
          <>
            <div style={styles.heading}>
              <Title level={3} style={{ color: theme.textColor, margin: 0, fontWeight: 700 }}>Get Started Free</Title>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                15-day free trial · No credit card required
              </Text>
            </div>

            <Form layout="vertical" onFinish={handleSubmit(onStep1Submit)}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item label={<span style={{ ...styles.label, color: theme.labelColor }}>First Name</span>} validateStatus={errors.first_name ? 'error' : ''} help={errors.first_name?.message} style={{ flex: 1 }}>
                  <Controller name="first_name" control={control} render={({ field }) => <Input {...field} prefix={<UserOutlined />} placeholder="John" size="large" />} />
                </Form.Item>
                <Form.Item label={<span style={{ ...styles.label, color: theme.labelColor }}>Last Name</span>} validateStatus={errors.last_name ? 'error' : ''} help={errors.last_name?.message} style={{ flex: 1 }}>
                  <Controller name="last_name" control={control} render={({ field }) => <Input {...field} placeholder="Doe" size="large" />} />
                </Form.Item>
              </div>

              <Form.Item label={<span style={{ ...styles.label, color: theme.labelColor }}>Work Email</span>} validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
                <Controller name="email" control={control} render={({ field }) => <Input {...field} prefix={<MailOutlined />} placeholder="you@company.com" size="large" />} />
              </Form.Item>

              <Form.Item label={<span style={{ ...styles.label, color: theme.labelColor }}>Password</span>} validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
                <Controller name="password" control={control} render={({ field }) => <Input.Password {...field} prefix={<LockOutlined />} placeholder="Min 8 chars, mixed case, number, symbol" size="large" />} />
              </Form.Item>

              <Form.Item label={<span style={{ ...styles.label, color: theme.labelColor }}>Company Name</span>} validateStatus={errors.company_name ? 'error' : ''} help={errors.company_name?.message}>
                <Controller name="company_name" control={control} render={({ field }) => <Input {...field} prefix={<BankOutlined />} placeholder="Acme Services Pvt. Ltd." size="large" />} />
              </Form.Item>

              <Form.Item label={<span style={{ ...styles.label, color: theme.labelColor }}>Phone <span style={{ color: theme.textMuted, fontSize: 11 }}>(optional)</span></span>} validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
                <Controller name="phone" control={control} render={({ field }) => <Input {...field} prefix={<PhoneOutlined />} placeholder="+91 98765 43210" size="large" />} />
              </Form.Item>

              <Button type="primary" htmlType="submit" block size="large" style={{ ...styles.primaryBtn, background: theme.primaryBtnBg, boxShadow: theme.primaryBtnShadow }}>
                Next — Choose Your Plan →
              </Button>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>Already have an account? </Text>
              <Link to="/login" style={{ color: '#3D55E8', fontWeight: 600 }}>Sign in</Link>
            </div>
          </>
        )}

        {/* ═══ STEP 2 ═══ */}
        {step === 2 && (
          <>
            <div style={styles.heading}>
              <Title level={3} style={{ color: theme.textColor, margin: '8px 0 0', fontWeight: 700 }}>Choose Your Plan</Title>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                All plans include a <strong style={{ color: '#3D55E8' }}>15-day free trial</strong>. Cancel anytime.
              </Text>
            </div>

            <div style={styles.planGrid}>
              {PLANS.map((plan) => {
                const dbPlan = plans?.find((p) => p.name.toLowerCase() === plan.slug || (plan.slug === 'professional' && p.name.toLowerCase() === 'pro'));
                const priceStr = dbPlan ? formatPlanPrice(dbPlan.price_monthly, dbPlan.currency || 'USD', currency) : getPlanPricing(plan.slug, currency).formatted;
                const limitStr = dbPlan?.max_appointments_monthly !== undefined ? (dbPlan.max_appointments_monthly ? `${dbPlan.max_appointments_monthly}` : 'Unlimited') : `${plan.appointments}`;
                const usersStr = dbPlan?.max_total_users !== undefined ? (dbPlan.max_total_users ? `${dbPlan.max_total_users}` : 'Unlimited') : '200';
                const featuresList = dbPlan?.features || plan.features;

                return (
                  <div
                    key={plan.slug}
                    onClick={() => setSelectedPlan(plan.slug)}
                    style={{
                      ...styles.planCard,
                      ...theme.planCard(selectedPlan === plan.slug, plan.color),
                      transform: selectedPlan === plan.slug ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    {plan.popular && (
                      <div style={{ ...styles.popularBadge, background: plan.gradient }}>
                        Most Popular
                      </div>
                    )}
                    <div style={{ ...styles.planIcon, background: plan.gradient }}>{plan.icon}</div>
                    <div style={{ ...styles.planName, color: theme.textColor }}>{plan.name}</div>
                    <div style={styles.planPrice}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: theme.textColor }}>{priceStr}</span>
                      <span style={{ color: theme.textMuted, fontSize: 12 }}>/mo</span>
                    </div>
                    
                    {/* Display Limits */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ ...styles.planUsersTag, background: `${plan.color}22`, color: plan.color }}>
                        <CalendarOutlined style={{ fontSize: 11 }} /> {limitStr} appts/mo
                      </div>
                      <div style={{ ...styles.planUsersTag, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34, 51, 204, 0.06)', color: theme.textMuted }}>
                        <TeamOutlined style={{ fontSize: 11 }} /> Up to {usersStr} users
                      </div>
                    </div>

                    <ul style={styles.planFeatures}>
                      {featuresList.map((f: string) => (
                        <li key={f} style={{ ...styles.planFeatureItem, color: theme.textMuted }}>
                          <CheckCircleFilled style={{ color: plan.color, fontSize: 11, flexShrink: 0 }} />
                          <span>{formatFeatureName(f)}</span>
                        </li>
                      ))}
                    </ul>
                    {selectedPlan === plan.slug && (
                      <div style={{ ...styles.selectedCheck, background: plan.gradient }}>
                        <CheckCircleFilled />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Custom plan tile */}
              <div
                onClick={() => setShowCustomModal(true)}
                style={{
                  ...styles.planCard,
                  ...theme.planCardCustom,
                  cursor: 'pointer',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 12,
                }}
              >
                <div style={{ ...styles.planIcon, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(34, 51, 204, 0.08)' }}>
                  <TeamOutlined style={{ color: theme.textColor }} />
                </div>
                <div style={{ ...styles.planName, color: theme.textColor }}>Custom</div>
                <div style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.5 }}>
                  200+ users<br />Tailored pricing
                </div>
                <div style={{ ...styles.contactBtn, color: theme.textColor, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(34, 51, 204, 0.15)' }}>Contact Us →</div>
              </div>
            </div>

            <Button
              type="primary"
              block
              size="large"
              loading={registerMutation.isPending}
              onClick={onConfirm}
              style={{ ...styles.primaryBtn, background: theme.primaryBtnBg, boxShadow: theme.primaryBtnShadow }}
            >
              Start 15-Day Free Trial →
            </Button>

            <Text style={{ display: 'block', textAlign: 'center', marginTop: 10, color: theme.textMuted, fontSize: 12 }}>
              No credit card required. Cancel anytime.
            </Text>
          </>
        )}
      </div>

      {/* ═══ Custom Plan Modal ═══ */}
      {showCustomModal && (
        <div style={{ ...styles.modalOverlay, background: theme.modalOverlayBg }} onClick={() => setShowCustomModal(false)}>
          <div style={{ ...styles.modal, background: theme.modalBg, border: theme.modalBorder }} onClick={(e) => e.stopPropagation()}>
            <button style={{ ...styles.modalClose, background: theme.toggleBg, color: theme.textColor }} onClick={() => setShowCustomModal(false)}>
              <CloseOutlined />
            </button>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
            <Title level={4} style={{ color: theme.textColor, margin: '0 0 8px' }}>Let's build your custom plan</Title>
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 1.7 }}>
              Need more than 2,000 appointments/month or a custom user cap?<br />
              Our team will put together a plan that fits your business perfectly.
            </Text>
            <div style={styles.contactList}>
              <a href="tel:+919876543210" style={{ ...styles.contactItem, background: theme.contactItemBg, border: theme.contactItemBorder, color: theme.textColor }}>
                <PhoneOutlined style={{ color: '#3D55E8' }} />
                <span>+91 98765 43210</span>
              </a>
              <a href="mailto:sales@fieldforce.com" style={{ ...styles.contactItem, background: theme.contactItemBg, border: theme.contactItemBorder, color: theme.textColor }}>
                <MailOutlined style={{ color: '#3D55E8' }} />
                <span>sales@fieldforce.com</span>
              </a>
            </div>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 12 }}>
              We typically respond within one business day.
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    transition: 'background 0.3s ease',
  },
  card: {
    width: '100%',
    maxWidth: 580,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 20,
    padding: '36px 40px',
    transition: 'all 0.3s ease',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: '-0.3px',
  },
  steps: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    marginBottom: 28,
    flexWrap: 'wrap',
    rowGap: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
    transition: 'all 0.3s',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 600,
    transition: 'color 0.3s',
  },
  stepLine: {
    width: 32,
    height: 1,
    background: 'rgba(120, 120, 120, 0.25)',
    margin: '0 8px',
  },
  heading: {
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  primaryBtn: {
    border: 'none',
    height: 48,
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: '-0.2px',
    marginTop: 4,
    transition: 'all 0.2s ease',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '0 0 4px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  planGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 14,
    padding: '18px 16px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: '#fff',
  },
  planName: {
    fontWeight: 700,
    fontSize: 15,
  },
  planPrice: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  planUsersTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 20,
    width: 'fit-content',
  },
  planFeatures: {
    listStyle: 'none',
    margin: '4px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  planFeatureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    fontSize: 11,
    lineHeight: 1.4,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    padding: '3px 10px',
    borderBottomLeftRadius: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  selectedCheck: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#fff',
  },
  contactBtn: {
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    marginTop: 4,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
    transition: 'all 0.3s ease',
  },
  modal: {
    borderRadius: 20,
    padding: '40px 36px',
    maxWidth: 440,
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    transition: 'all 0.2s',
  },
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 20px',
    borderRadius: 12,
    textDecoration: 'none',
    fontSize: 15,
    fontWeight: 500,
    transition: 'background 0.2s',
  },
};
