import { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Space, DatePicker, Select, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  StarFilled,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/utils/format-date';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface SatisfactionMetrics {
  average_rating: number;
  total_reviews: number;
  nps_score: number;
  satisfaction_rate: number;
  response_rate: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

interface ReviewRecord {
  id: string;
  customer_name: string;
  work_order_number: string;
  rating: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  technician_name: string;
  created_at: string;
}

interface TechnicianRating {
  id: string;
  name: string;
  average_rating: number;
  total_reviews: number;
  five_star_percentage: number;
}

export default function CustomerSatisfactionAnalytics() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  // Mock data - replace with actual API calls
  const metrics: SatisfactionMetrics = {
    average_rating: 4.6,
    total_reviews: 248,
    nps_score: 72,
    satisfaction_rate: 92.3,
    response_rate: 68.5,
    five_star: 156,
    four_star: 62,
    three_star: 18,
    two_star: 8,
    one_star: 4,
  };

  const recentReviews: ReviewRecord[] = [
    {
      id: '1',
      customer_name: 'John Smith',
      work_order_number: 'WO-2024-001',
      rating: 5,
      comment: 'Excellent service! Very professional and quick.',
      sentiment: 'positive',
      technician_name: 'Mike Johnson',
      created_at: '2024-02-17T10:00:00Z',
    },
    {
      id: '2',
      customer_name: 'Jane Doe',
      work_order_number: 'WO-2024-002',
      rating: 4,
      comment: 'Good work, but took longer than expected.',
      sentiment: 'positive',
      technician_name: 'Sarah Williams',
      created_at: '2024-02-16T14:30:00Z',
    },
    {
      id: '3',
      customer_name: 'Bob Anderson',
      work_order_number: 'WO-2024-003',
      rating: 2,
      comment: 'Service was okay but technician was late.',
      sentiment: 'negative',
      technician_name: 'Tom Brown',
      created_at: '2024-02-15T11:00:00Z',
    },
  ];

  const topTechnicians: TechnicianRating[] = [
    {
      id: '1',
      name: 'Mike Johnson',
      average_rating: 4.9,
      total_reviews: 45,
      five_star_percentage: 93.3,
    },
    {
      id: '2',
      name: 'Sarah Williams',
      average_rating: 4.7,
      total_reviews: 38,
      five_star_percentage: 84.2,
    },
    {
      id: '3',
      name: 'Tom Brown',
      average_rating: 4.2,
      total_reviews: 32,
      five_star_percentage: 65.6,
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <Space size={2}>
        {[1, 2, 3, 4, 5].map((star) =>
          star <= rating ? (
            <StarFilled key={star} style={{ color: '#faad14' }} />
          ) : (
            <StarOutlined key={star} style={{ color: '#d9d9d9' }} />
          )
        )}
      </Space>
    );
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SmileOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
      case 'neutral':
        return <MehOutlined style={{ color: '#faad14', fontSize: 18 }} />;
      case 'negative':
        return <FrownOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const reviewColumns: ColumnsType<ReviewRecord> = [
    {
      title: t('analytics.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: t('analytics.workOrder'),
      dataIndex: 'work_order_number',
      key: 'work_order_number',
      render: (number: string) => <Tag color="blue">{number}</Tag>,
    },
    {
      title: t('analytics.rating'),
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => renderStars(rating),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: t('analytics.sentiment'),
      dataIndex: 'sentiment',
      key: 'sentiment',
      render: (sentiment: string) => (
        <Space>
          {getSentimentIcon(sentiment)}
          <Text>{t(`analytics.${sentiment}`)}</Text>
        </Space>
      ),
    },
    {
      title: t('analytics.comment'),
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
    },
    {
      title: t('analytics.technician'),
      dataIndex: 'technician_name',
      key: 'technician_name',
    },
    {
      title: t('analytics.date'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
  ];

  const technicianColumns: ColumnsType<TechnicianRating> = [
    {
      title: t('analytics.rank'),
      key: 'rank',
      render: (_, __, index) => (
        <div style={{ fontSize: 18, fontWeight: 600, color: index === 0 ? '#faad14' : '#8c8c8c' }}>
          #{index + 1}
          {index === 0 && <TrophyOutlined style={{ marginLeft: 4, color: '#faad14' }} />}
        </div>
      ),
      width: 80,
    },
    {
      title: t('analytics.technician'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: t('analytics.averageRating'),
      dataIndex: 'average_rating',
      key: 'average_rating',
      render: (rating: number) => (
        <Space>
          {renderStars(Math.round(rating))}
          <Text strong>{rating.toFixed(1)}</Text>
        </Space>
      ),
      sorter: (a, b) => a.average_rating - b.average_rating,
    },
    {
      title: t('analytics.totalReviews'),
      dataIndex: 'total_reviews',
      key: 'total_reviews',
      align: 'center',
    },
    {
      title: t('analytics.fiveStarRate'),
      dataIndex: 'five_star_percentage',
      key: 'five_star_percentage',
      render: (percentage: number) => (
        <Tag color={percentage > 80 ? 'success' : percentage > 60 ? 'warning' : 'error'}>
          {percentage.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  const totalRatings = metrics.five_star + metrics.four_star + metrics.three_star + metrics.two_star + metrics.one_star;

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Select placeholder={t('analytics.filterTechnician')} allowClear style={{ width: 200 }}>
            <Select.Option value="tech-1">Mike Johnson</Select.Option>
            <Select.Option value="tech-2">Sarah Williams</Select.Option>
          </Select>
          <Select placeholder={t('analytics.filterRating')} allowClear style={{ width: 150 }}>
            <Select.Option value="5">5 {t('analytics.stars')}</Select.Option>
            <Select.Option value="4">4 {t('analytics.stars')}</Select.Option>
            <Select.Option value="3">3 {t('analytics.stars')}</Select.Option>
            <Select.Option value="2">2 {t('analytics.stars')}</Select.Option>
            <Select.Option value="1">1 {t('analytics.star')}</Select.Option>
          </Select>
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('analytics.averageRating')}
              value={metrics.average_rating}
              precision={1}
              suffix="/ 5"
              prefix={renderStars(Math.round(metrics.average_rating))}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('analytics.npsScore')}
              value={metrics.nps_score}
              prefix={metrics.nps_score > 70 ? <RiseOutlined /> : <FallOutlined />}
              valueStyle={{ color: metrics.nps_score > 70 ? '#52c41a' : '#faad14' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {metrics.nps_score > 70 ? t('analytics.excellent') : metrics.nps_score > 50 ? t('analytics.good') : t('analytics.needsImprovement')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('analytics.satisfactionRate')}
              value={metrics.satisfaction_rate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('analytics.fourPlusStars')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('analytics.totalReviews')}
              value={metrics.total_reviews}
              prefix={<StarFilled />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {metrics.response_rate.toFixed(1)}% {t('analytics.responseRate')}
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t('analytics.ratingDistribution')}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = metrics[`${['one', 'two', 'three', 'four', 'five'][stars - 1]}_star` as keyof SatisfactionMetrics] as number;
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                return (
                  <div key={stars}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space>
                        {renderStars(stars)}
                      </Space>
                      <Text type="secondary">{count} {t('analytics.reviews')}</Text>
                    </div>
                    <Progress
                      percent={percentage}
                      strokeColor={stars >= 4 ? '#52c41a' : stars === 3 ? '#faad14' : '#ff4d4f'}
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t('analytics.topRatedTechnicians')}>
            <Table
              columns={technicianColumns}
              dataSource={topTechnicians}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title={t('analytics.recentCustomerReviews')}>
        <Table
          columns={reviewColumns}
          dataSource={recentReviews}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}