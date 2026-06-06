import { Card, Button, Result } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';

export default function CustomReportBuilderPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('customReportBuilder.title')}
        subtitle={t('customReportBuilder.subtitle')}
        onBack={() => navigate('/reports')}
      />

      <Card>
        <Result
          icon={<ToolOutlined style={{ color: '#722ed1' }} />}
          title={t('customReportBuilder.comingSoon')}
          subTitle={t('customReportBuilder.description')}
          extra={
            <Button type="primary" onClick={() => navigate('/reports')}>
              {t('customReportBuilder.viewReports')}
            </Button>
          }
        />
      </Card>
    </div>
  );
}