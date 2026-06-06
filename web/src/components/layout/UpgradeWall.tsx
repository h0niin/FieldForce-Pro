import { MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLogout, usePublicSubscriptionPlans } from '@/hooks/use-auth';
import { useUiStore } from '@/store/ui.store';
import { formatPlanPrice, getPlanPricing } from '@/utils/pricing';

export function UpgradeWall() {
  const { t } = useTranslation();
  const logout = useLogout();
  const currency = useUiStore((s) => s.currency);
  const { data: plans } = usePublicSubscriptionPlans();

  const basicPlan = plans?.find((p) => p.name.toLowerCase() === 'basic');
  const professionalPlan = plans?.find((p) => p.name.toLowerCase().includes('professional') || p.name.toLowerCase() === 'pro');
  const enterprisePlan = plans?.find((p) => p.name.toLowerCase() === 'enterprise');

  const basicPrice = basicPlan ? `${formatPlanPrice(basicPlan.price_monthly, basicPlan.currency || 'USD', currency)}/mo` : getPlanPricing('basic', currency).formatted + '/mo';
  const professionalPrice = professionalPlan ? `${formatPlanPrice(professionalPlan.price_monthly, professionalPlan.currency || 'USD', currency)}/mo` : getPlanPricing('professional', currency).formatted + '/mo';
  const enterprisePrice = enterprisePlan ? `${formatPlanPrice(enterprisePlan.price_monthly, enterprisePlan.currency || 'USD', currency)}/mo` : getPlanPricing('enterprise', currency).formatted + '/mo';

  const basicLimit = basicPlan?.max_appointments_monthly !== undefined ? (basicPlan.max_appointments_monthly ? `${basicPlan.max_appointments_monthly} ${t('upgradeWall.apptsMo')}` : t('upgradeWall.unlimitedAppts')) : t('upgradeWall.basicDefaultLimit');
  const professionalLimit = professionalPlan?.max_appointments_monthly !== undefined ? (professionalPlan.max_appointments_monthly ? `${professionalPlan.max_appointments_monthly} ${t('upgradeWall.apptsMo')}` : t('upgradeWall.unlimitedAppts')) : t('upgradeWall.proDefaultLimit');
  const enterpriseLimit = enterprisePlan?.max_appointments_monthly !== undefined ? (enterprisePlan.max_appointments_monthly ? `${enterprisePlan.max_appointments_monthly} ${t('upgradeWall.apptsMo')}` : t('upgradeWall.unlimitedAppts')) : t('upgradeWall.enterpriseDefaultLimit');

  const renderPlans = [
    { name: t('upgradeWall.plans.basic'), price: basicPrice, limit: basicLimit },
    { name: t('upgradeWall.plans.pro'), price: professionalPrice, limit: professionalLimit },
    { name: t('upgradeWall.plans.enterprise'), price: enterprisePrice, limit: enterpriseLimit },
  ];


  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 32,
          }}
        >
          <LockOutlined style={{ color: '#ef4444' }} />
        </div>

        <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>
          {t('upgradeWall.title')}
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
          {t('upgradeWall.description')}
        </p>

        {/* Plan highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {renderPlans.map((plan) => (

            <div
              key={plan.name}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '14px 10px',
              }}
            >
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{plan.name}</div>
              <div style={{ color: '#a78bfa', fontWeight: 800, fontSize: 16, margin: '4px 0 2px' }}>
                {plan.price}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{plan.limit}</div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
          {t('upgradeWall.contactLabel')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <a
            href="tel:+919876543210"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <PhoneOutlined style={{ color: '#a78bfa' }} />
            +91 98765 43210
          </a>
          <a
            href="mailto:sales@fieldforce.com"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <MailOutlined style={{ color: '#a78bfa' }} />
            sales@fieldforce.com
          </a>
        </div>

        <Button
          type="text"
          onClick={() => logout.mutate()}
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}
        >
          {t('upgradeWall.signOut')}
        </Button>
      </div>
    </div>
  );
}