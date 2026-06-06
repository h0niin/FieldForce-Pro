import React from 'react';
import { Upload, message, List, Button, Typography, Space, Skeleton } from 'antd';
import { InboxOutlined, PaperClipOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useRequestAttachments, useUploadAttachments } from '@/hooks/use-attachments';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
const { Text } = Typography;

interface FileUploadZoneProps {
  requestId: string;
}

export default function FileUploadZone({ requestId }: FileUploadZoneProps) {
  const { t } = useTranslation();
  const { data: attachments, isLoading } = useRequestAttachments(requestId);
  const { mutate: uploadAttachments, isPending } = useUploadAttachments();

  const props: UploadProps = {
    name: 'files',
    multiple: true,
    maxCount: 5,
    beforeUpload: (file, fileList) => {
      const isAllowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'].includes(file.type);
      if (!isAllowed) {
        message.error(t('fileUploadZone.fileNotSupported', { name: file.name }));
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(t('fileUploadZone.fileSizeExceeded'));
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent automatic upload
    },
    onChange: (info) => {
      // Trigger upload mutation manually since we blocked automatic upload
      if (info.fileList.length > 0 && !isPending && info.file.status !== 'removed') {
        const filesToUpload = info.fileList.map((f) => f.originFileObj as File).filter(Boolean);
        if (filesToUpload.length > 0) {
          uploadAttachments(
            { requestId, files: filesToUpload },
            {
              onSuccess: () => {
                info.fileList.length = 0; // Clear UI list
              }
            }
          );
        }
      }
    },
    fileList: [], // Managed internally by Antd for drag/drop briefly, cleared on success
  };

  return (
    <div className="mt-6">
      <Dragger {...props} disabled={isPending}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">{t('fileUploadZone.clickOrDrag')}</p>
        <p className="ant-upload-hint">
          {t('fileUploadZone.uploadHint')}
        </p>
      </Dragger>

      <div className="mt-6">
        <Text strong>{t('fileUploadZone.attachedFiles')}</Text>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} className="mt-4" />
        ) : (
          <List
            className="mt-4"
            itemLayout="horizontal"
            dataSource={attachments?.data || []}
            locale={{ emptyText: t('fileUploadZone.noFilesAttached') }}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button type="link" icon={<DownloadOutlined />} href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${item.file_url}`} target="_blank" download>
                    {t('fileUploadZone.download')}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<PaperClipOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                  title={<a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${item.file_url}`} target="_blank" rel="noreferrer">{item.file_name}</a>}
                  description={`${(item.file_size / 1024).toFixed(2)} KB`}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}