import { useState, useEffect } from 'react';
import { CloseOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface TrialBannerProps {
  subscriptionEnd: string | null;
  subscriptionStatus: string;
}

export function TrialBanner({ subscriptionEnd, subscriptionStatus }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Re-show banner if status changes (e.g. after page reload)
  useEffect(() => {
    setDismissed(false);
  }, [subscriptionStatus]);

  if (dismissed || subscriptionStatus !== 'trial' || !subscriptionEnd) return null;

  const now = new Date();
  const end = new Date(subscriptionEnd);
  const msLeft = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null; // Expired — the UpgradeWall handles it

  const isUrgent = daysLeft <= 3;
  const gradient = isUrgent
    ? 'linear-gradient(90deg, #dc2626, #ef4444)'
    : 'linear-gradient(90deg, #6d28d9, #8b5cf6)';

  return (
    <div
      style={{
        background: gradient,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <RocketOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }} />
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
        {isUrgent
          ? t('trialBanner.urgentMessage', { count: daysLeft })
          : t('trialBanner.normalMessage', { count: daysLeft })}
      </span>
      <button
        onClick={() => navigate('/settings/subscription')}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 12px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {t('trialBanner.upgradePlan')}
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: 'absolute',
          right: 12,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <CloseOutlined />
      </button>
    </div>
  );
}