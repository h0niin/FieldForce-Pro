import { useState } from 'react';
import { Card, Upload, List, Button, Space, Tag, Empty, Image, Typography, Progress, Modal } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  PaperClipOutlined,
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FileOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  uploaded_by?: string;
  created_at: string;
}

interface WorkOrderAttachmentsComponentProps {
  workOrderId: string;
  attachments?: Attachment[];
  isLoading?: boolean;
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (attachmentId: string) => Promise<void>;
  onDownload?: (attachment: Attachment) => void;
}

export default function WorkOrderAttachmentsComponent({
  workOrderId,
  attachments = [],
  isLoading = false,
  onUpload,
  onDelete,
  onDownload,
}: WorkOrderAttachmentsComponentProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    if (fileType === 'application/pdf') return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    if (fileType.includes('word')) return <FileWordOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet'))
      return <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    if (fileType.includes('text')) return <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />;
    return <FileOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return t('workOrderAttachments.zeroBytes');
    const k = 1024;
    const sizes = [t('workOrderAttachments.bytes'), t('workOrderAttachments.kb'), t('workOrderAttachments.mb'), t('workOrderAttachments.gb')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePreview = (attachment: Attachment) => {
    if (attachment.file_type.startsWith('image/')) {
      setPreviewImage(attachment.file_url);
      setPreviewTitle(attachment.file_name);
      setPreviewVisible(true);
    } else if (onDownload) {
      onDownload(attachment);
    }
  };

  const handleDelete = (attachmentId: string, fileName: string) => {
    Modal.confirm({
      title: t('workOrderAttachments.deleteAttachment'),
      content: t('workOrderAttachments.confirmDelete', { fileName }),
      okText: t('workOrderAttachments.delete'),
      okType: 'danger',
      onOk: async () => {
        if (onDelete) {
          await onDelete(attachmentId);
        }
      },
    });
  };

  const uploadProps: UploadProps = {
    beforeUpload: async (file) => {
      if (!onUpload) return false;

      setUploading(true);
      try {
        await onUpload(file);
      } finally {
        setUploading(false);
      }
      return false; // Prevent default upload behavior
    },
    showUploadList: false,
    multiple: true,
  };

  const totalSize = attachments.reduce((sum, att) => sum + att.file_size, 0);

  return (
    <Card
      title={
        <Space>
          <PaperClipOutlined />
          <span>{t('workOrderAttachments.attachments')}</span>
          <Tag color="blue">{attachments.length}</Tag>
          {totalSize > 0 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({formatFileSize(totalSize)})
            </Text>
          )}
        </Space>
      }
      extra={
        <Upload {...uploadProps}>
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            {t('workOrderAttachments.upload')}
          </Button>
        </Upload>
      }
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Progress type="circle" percent={50} status="active" />
        </div>
      ) : attachments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('workOrderAttachments.noAttachments')}
          style={{ padding: '40px 0' }}
        >
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />}>
              {t('workOrderAttachments.uploadFirstFile')}
            </Button>
          </Upload>
        </Empty>
      ) : (
        <List
          dataSource={attachments}
          renderItem={(attachment) => (
            <List.Item
              key={attachment.id}
              actions={[
                attachment.file_type.startsWith('image/') && (
                  <Button
                    key="preview"
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(attachment)}
                  >
                    {t('workOrderAttachments.preview')}
                  </Button>
                ),
                <Button
                  key="download"
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => onDownload && onDownload(attachment)}
                >
                  {t('workOrderAttachments.download')}
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(attachment.id, attachment.file_name)}
                />,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(attachment.file_type)}
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{attachment.file_name}</span>
                    <Tag color="default" style={{ fontSize: 11 }}>
                      {formatFileSize(attachment.file_size)}
                    </Tag>
                  </Space>
                }
                description={
                  <Space split="|" size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {attachment.file_type}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('workOrderAttachments.uploaded', { date: formatDateTime(attachment.created_at) })}
                    </Text>
                    {attachment.uploaded_by && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('workOrderAttachments.by', { user: attachment.uploaded_by })}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        <Image src={previewImage} alt={previewTitle} style={{ width: '100%' }} />
      </Modal>
    </Card>
  );
}