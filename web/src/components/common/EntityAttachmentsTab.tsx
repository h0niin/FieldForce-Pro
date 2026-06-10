import { Card, Upload, Button, List, Typography, Space, message, Popconfirm } from 'antd';
import { UploadOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios-instance';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

interface EntityAttachmentsTabProps {
  entityType: string;
  entityId: string;
}

export const EntityAttachmentsTab = ({ entityType, entityId }: EntityAttachmentsTabProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['attachments', entityType, entityId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/attachments/global/${entityType}/${entityId}`);
      return res.data;
    },
  });

  const attachments: Attachment[] = Array.isArray(data?.data?.data) 
    ? data.data.data 
    : Array.isArray(data?.data) 
      ? data.data 
      : Array.isArray(data) 
        ? data 
        : [];

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    // Append fields BEFORE files so Multer diskStorage can access req.body in the destination callback
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    formData.append('files', file);

    try {
      await api.post('/attachments/global-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('File uploaded successfully');
      onSuccess('Ok');
      queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Upload failed');
      onError(err);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/attachments/global/${id}`);
    },
    onSuccess: () => {
      message.success('Attachment deleted successfully');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      message.error('Failed to delete attachment');
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCleanUrl = (url: string) => {
    if (!url) return '';
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const fullUrl = `${baseUrl}${url}`;
    return fullUrl.replace(/\/api\/api\//g, '/api/');
  };

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Upload customRequest={handleUpload} showUploadList={false}>
          <Button icon={<UploadOutlined />}>Upload File</Button>
        </Upload>

        <List
          loading={isLoading}
          dataSource={attachments}
          renderItem={(attachment) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  href={getCleanUrl(attachment.file_url)}
                  target="_blank" 
                  key="download"
                >
                  Download
                </Button>,
                <Popconfirm
                  title="Delete file"
                  description="Are you sure you want to delete this file?"
                  onConfirm={() => deleteMutation.mutate(attachment.id)}
                  okText="Yes"
                  cancelText="No"
                  key="delete"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<FileOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={
                  <a href={getCleanUrl(attachment.file_url)} target="_blank" rel="noreferrer">
                    {attachment.file_name}
                  </a>
                }
                description={
                  <Space>
                    <Text type="secondary">{formatFileSize(attachment.file_size)}</Text>
                    <Text type="secondary">•</Text>
                    <Text type="secondary">{formatDateTime(attachment.created_at)}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
};
