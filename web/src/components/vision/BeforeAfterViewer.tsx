import { Card, Row, Col, Typography, Tag, Progress, Descriptions, Space } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { BeforeAfterResult } from '../../api/vision.api';

const { Text, Paragraph } = Typography;

interface BeforeAfterViewerProps {
  result: BeforeAfterResult | null;
  beforeUrl?: string;
  afterUrl?: string;
  loading?: boolean;
}

export default function BeforeAfterViewer({
  result,
  beforeUrl,
  afterUrl,
  loading = false,
}: BeforeAfterViewerProps) {
  const { t } = useTranslation();
  if (!result) return null;

  return (
    <Card loading={loading} title={<><SwapOutlined /> {t('beforeAfterViewer.title')}</>}>
      <Row gutter={[16, 16]}>
        {beforeUrl && afterUrl && (
          <>
            <Col span={12}>
              <Card size="small" title={t('beforeAfterViewer.before')}>
                <img src={beforeUrl} alt={t('beforeAfterViewer.before')} style={{ width: '100%', borderRadius: 4 }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title={t('beforeAfterViewer.after')}>
                <img src={afterUrl} alt={t('beforeAfterViewer.after')} style={{ width: '100%', borderRadius: 4 }} />
              </Card>
            </Col>
          </>
        )}
        <Col span={24}>
          <Descriptions bordered size="small" column={4}>
            <Descriptions.Item label={t('beforeAfterViewer.changesDetected')}>
              <Tag color={result.significant_change ? 'green' : 'orange'}>
                {result.significant_change ? t('beforeAfterViewer.yes') : t('beforeAfterViewer.no')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('beforeAfterViewer.changePercentage')}>
              <Progress percent={Math.min(100, Math.round(result.change_percentage))} size="small" />
            </Descriptions.Item>
            <Descriptions.Item label={t('beforeAfterViewer.similarity')}>
              {(result.similarity_score * 100).toFixed(1)}%
            </Descriptions.Item>
            <Descriptions.Item label={t('beforeAfterViewer.regionsChanged')}>
              {result.changed_regions.length}
            </Descriptions.Item>
          </Descriptions>
        </Col>
        <Col span={24}>
          <Paragraph type="secondary">{result.analysis}</Paragraph>
        </Col>
      </Row>
    </Card>
  );
}