import { useState } from 'react';
import { Input, Button, Card, Space, Typography, Tag, Table, Empty, Alert } from 'antd';
import { SearchOutlined, ThunderboltOutlined, BarChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNLQuery } from '../../hooks/use-analytics';

const { Text, Paragraph } = Typography;

const VIZ_ICONS: Record<string, string> = {
  bar_chart: 'barChart',
  line_chart: 'lineChart',
  pie_chart: 'pieChart',
  metric: 'metric',
};

export default function NLQueryBar() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const nlQuery = useNLQuery();

  const handleSearch = () => {
    if (!query.trim()) return;
    nlQuery.mutate({ query: query.trim() });
  };

  const result = nlQuery.data?.data;

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined />
          <span>{t('nlQueryBar.aiAnalyticsQuery')}</span>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('nlQueryBar.placeholder')}
            onPressEnter={handleSearch}
            size="large"
            prefix={<SearchOutlined />}
          />
          <Button
            type="primary"
            size="large"
            onClick={handleSearch}
            loading={nlQuery.isPending}
          >
            {t('nlQueryBar.query')}
          </Button>
        </Space.Compact>

        <Space wrap>
          <Text type="secondary">{t('nlQueryBar.try')}:</Text>
          {[
            'How many work orders by status?',
            'Show me overdue invoices',
            'What is the health score of assets?',
          ].map((suggestion) => (
            <Tag
              key={suggestion}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setQuery(suggestion);
              }}
            >
              {suggestion}
            </Tag>
          ))}
        </Space>

        {result && (
          <Card size="small" style={{ marginTop: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t('nlQueryBar.result')}</Text>
              <Paragraph type="secondary">{result.explanation}</Paragraph>

              {result.sql_query && (
                <Alert
                  type="info"
                  message={
                    <code style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
                      {result.sql_query}
                    </code>
                  }
                  style={{ marginBottom: 8 }}
                />
              )}

              {result.visualization_hint && (
                <Tag icon={<BarChartOutlined />} color="purple">
                  {t('nlQueryBar.suggested')}: {t(`nlQueryBar.vizTypes.${VIZ_ICONS[result.visualization_hint]}` as any) || result.visualization_hint}
                </Tag>
              )}

              {result.results && result.results.length > 0 ? (
                <Table
                  dataSource={result.results}
                  columns={Object.keys(result.results[0]).map((key) => ({
                    title: key,
                    dataIndex: key,
                    key,
                  }))}
                  size="small"
                  pagination={false}
                  rowKey={(_, i) => String(i)}
                />
              ) : (
                result.sql_query && (
                  <Text type="secondary">
                    {t('nlQueryBar.queryGeneratedSuccess')}
                  </Text>
                )
              )}
            </Space>
          </Card>
        )}

        {!result && !nlQuery.isPending && (
          <Empty description={t('nlQueryBar.emptyDescription')} />
        )}
      </Space>
    </Card>
  );
}