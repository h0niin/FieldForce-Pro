import { Button, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph } = Typography;

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

export default function CookieConsentModal() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasConsented) {
      // Show immediately (no delay)
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '20px',
          maxWidth: '600px',
          width: '100%',
          padding: '50px 40px',
          position: 'relative',
          boxShadow: '0 25px 70px rgba(24, 144, 255, 0.2), 0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(24, 144, 255, 0.1)',
        }}
      >
        {/* Cookie Icon */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div
            style={{
              fontSize: '100px',
              lineHeight: 1,
              marginBottom: '24px',
              filter: 'drop-shadow(0 4px 8px rgba(24, 144, 255, 0.15))',
            }}
          >
            🍪
          </div>

          <Title
            level={2}
            style={{
              marginBottom: '16px',
              fontSize: '26px',
              fontWeight: 600,
            }}
          >
            {t('cookieConsent.title')}
          </Title>

          <Paragraph
            style={{
              fontSize: '15px',
              opacity: 0.8,
              marginBottom: '40px',
              maxWidth: '480px',
              margin: '0 auto 40px',
              lineHeight: 1.6,
            }}
          >
            {t('cookieConsent.message')}
          </Paragraph>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Button
            type="primary"
            size="large"
            onClick={handleAccept}
            style={{
              height: '50px',
              fontSize: '16px',
              fontWeight: 500,
              paddingLeft: '48px',
              paddingRight: '48px',
              borderRadius: '25px',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
            }}
          >
            {t('cookieConsent.accept')}
          </Button>

          <Button
            type="text"
            shape="circle"
            icon={<CloseOutlined />}
            onClick={handleClose}
            size="large"
            style={{
              border: '1px solid var(--border-color)',
              opacity: 0.6,
            }}
          />
        </div>

        {/* Footer Text */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Paragraph
            style={{
              fontSize: '12px',
              opacity: 0.5,
              margin: 0,
            }}
          >
            🔒 Secure • Essential • No tracking
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
