import { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Select,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Descriptions,
  Modal,
  Empty,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDocuments, useUploadDocument, useDeleteDocument } from '../../hooks/use-documents';
import type { ParsedDocument } from '../../api/documents.api';

const { Title, Text, Paragraph } = Typography;

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  processing: 'processing',
  completed: 'success',
  failed: 'error',
  reviewed: 'blue',
};

export default function DocumentUploadPage() {
  const { t } = useTranslation();
  const [docType, setDocType] = useState('general');
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [previewDoc, setPreviewDoc] = useState<ParsedDocument | null>(null);

  const DOC_TYPE_OPTIONS = [
    { value: 'invoice', label: t('documentUpload.invoice') },
    { value: 'receipt', label: t('documentUpload.receipt') },
    { value: 'contract', label: t('documentUpload.contract') },
    { value: 'report', label: t('documentUpload.report') },
    { value: 'general', label: t('documentUpload.general') },
  ];

  const { data: documentsData, isLoading } = useDocuments({
    document_type: filterType,
    status: filterStatus,
  });
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const handleUpload = (file: File) => {
    uploadDoc.mutate({ file, documentType: docType });
  };

  const columns = [
    {
      title: t('documentUpload.fileName'),
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: t('documentUpload.type'),
      dataIndex: 'document_type',
      key: 'document_type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: t('documentUpload.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: t('documentUpload.confidence'),
      dataIndex: 'confidence',
      key: 'confidence',
      render: (val: number) =>
        val ? <Text>{(val * 100).toFixed(1)}%</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: t('documentUpload.pages'),
      dataIndex: 'pages',
      key: 'pages',
    },
    {
      title: t('documentUpload.actions'),
      key: 'actions',
      render: (_: any, record: ParsedDocument) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setPreviewDoc(record)}
          >
            {t('documentUpload.preview')}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteDoc.mutate(record.id)}
          >
            {t('documentUpload.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>{t('documentUpload.title')}</Title>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={t('documentUpload.uploadDocument')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Select
                  value={docType}
                  onChange={setDocType}
                  options={DOC_TYPE_OPTIONS}
                  style={{ width: 150 }}
                />
                <Upload
                  beforeUpload={(file) => {
                    handleUpload(file);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                >
                  <Button
                    icon={<UploadOutlined />}
                    type="primary"
                    loading={uploadDoc.isPending}
                  >
                    {t('documentUpload.uploadAndParse')}
                  </Button>
                </Upload>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title={t('documentUpload.parsedDocuments')}
            extra={
              <Space>
                <Select
                  placeholder={t('documentUpload.filterType')}
                  allowClear
                  value={filterType}
                  onChange={setFilterType}
                  options={DOC_TYPE_OPTIONS}
                  style={{ width: 130 }}
                />
                <Select
                  placeholder={t('documentUpload.filterStatus')}
                  allowClear
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'pending', label: t('documentUpload.statusOptions.pending') },
                    { value: 'processing', label: t('documentUpload.statusOptions.processing') },
                    { value: 'completed', label: t('documentUpload.statusOptions.completed') },
                    { value: 'failed', label: t('documentUpload.statusOptions.failed') },
                    { value: 'reviewed', label: t('documentUpload.statusOptions.reviewed') },
                  ]}
                  style={{ width: 130 }}
                />
              </Space>
            }
          >
            <Table
              dataSource={documentsData?.data || []}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              locale={{ emptyText: <Empty description={t('documentUpload.noDocuments')} /> }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={previewDoc?.file_name || t('documentUpload.documentPreview')}
        open={!!previewDoc}
        onCancel={() => setPreviewDoc(null)}
        width={700}
        footer={null}
      >
        {previewDoc && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label={t('documentUpload.type')}>{previewDoc.document_type}</Descriptions.Item>
              <Descriptions.Item label={t('documentUpload.status')}>
                <Tag color={STATUS_COLORS[previewDoc.status]}>{previewDoc.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('documentUpload.confidence')}>
                {previewDoc.confidence ? `${(previewDoc.confidence * 100).toFixed(1)}%` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('documentUpload.pages')}>{previewDoc.pages || '-'}</Descriptions.Item>
            </Descriptions>

            {previewDoc.extracted_fields && Object.keys(previewDoc.extracted_fields).length > 0 && (
              <Card title={t('documentUpload.extractedFields')} size="small">
                <Descriptions bordered size="small" column={1}>
                  {Object.entries(previewDoc.extracted_fields).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {String(value)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {previewDoc.extracted_text && (
              <Card title={t('documentUpload.extractedText')} size="small">
                <Paragraph
                  style={{ maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}
                >
                  {previewDoc.extracted_text}
                </Paragraph>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}