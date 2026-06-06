import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import NLQueryBar from '../../components/analytics/NLQueryBar';

const { Title } = Typography;

export default function NLAnalyticsPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>{t('nlAnalytics.aiPoweredAnalytics')}</Title>
      <NLQueryBar />
    </div>
  );
}