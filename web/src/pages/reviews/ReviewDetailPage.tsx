import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Rate } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useReview, useDeleteReview } from '@/hooks/use-reviews';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

const platformColors: Record<string, string> = {
  internal: 'blue',
  google: 'green',
  yelp: 'red',
  facebook: 'blue',
  other: 'default',
};

function formatPlatform(platform: string): string {
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

export default function ReviewDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: review, isLoading } = useReview(id!);
  const deleteReview = useDeleteReview();

  const handleDelete = () => {
    if (!review) return;
    showConfirmDialog({
      title: t('reviewDetails.deleteReview'),
      content: t('reviewDetails.deleteConfirmation'),
      onOk: async () => {
        await deleteReview.mutateAsync(review.id);
        navigate('/reviews');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('reviewDetails.reviewDetails')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!review) {
    return (
      <div>
        <PageHeader title={t('reviewDetails.reviewNotFound')} />
        <Card>{t('reviewDetails.reviewNotFoundMessage')}</Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('reviewDetails.reviewDetails')}
        onBack={() => navigate('/reviews')}
        extra={
          <Space>
            <PermissionGuard permission="reviews:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/reviews/${review.id}/edit`)}>
                {t('reviewDetails.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="reviews:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('reviewDetails.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Card title={t('reviewDetails.reviewInformation')}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('reviewDetails.rating')} span={2}>
            <Rate disabled value={review.rating} allowHalf />
            <span style={{ marginLeft: 8 }}>({review.rating} / 5)</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('reviewDetails.workOrder')}>
            {review.work_order_id || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('reviewDetails.customer')}>
            {review.contact_id || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('reviewDetails.platform')}>
            <Tag color={platformColors[review.platform] || 'default'}>
              {formatPlatform(review.platform)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('reviewDetails.submitted')}>
            {formatDateTime(review.created_at)}
          </Descriptions.Item>

          <Descriptions.Item label={t('reviewDetails.comment')} span={2}>
            {review.comment || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('reviewDetails.createdAt')}>
            {formatDateTime(review.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reviewDetails.updatedAt')}>
            {formatDateTime(review.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}