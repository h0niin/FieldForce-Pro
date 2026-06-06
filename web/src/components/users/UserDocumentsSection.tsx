import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Tooltip,
} from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import {
  useUserDocumentsByUserId,
  useCreateUserDocument,
  useDeleteUserDocument,
  useVerifyDocument,
  useUnverifyDocument,
} from '@/hooks/use-user-documents';
import type { UserDocument, DocumentType } from '@/api/user-documents.api';
import { formatDateTime } from '@/utils/format-date';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { useTranslation } from 'react-i18next'; // Rule 1

interface UserDocumentsSectionProps {
  userId: string;
}

const documentTypeOptions: { value: DocumentType; labelKey: string }[] = [
  { value: 'certification', labelKey: 'userDocuments.documentTypeOptions.certification' },
  { value: 'license', labelKey: 'userDocuments.documentTypeOptions.license' },
  { value: 'id_proof', labelKey: 'userDocuments.documentTypeOptions.idProof' },
  { value: 'insurance', labelKey: 'userDocuments.documentTypeOptions.insurance' },
  { value: 'contract', labelKey: 'userDocuments.documentTypeOptions.contract' },
  { value: 'other', labelKey: 'userDocuments.documentTypeOptions.other' },
];

export default function UserDocumentsSection({ userId }: UserDocumentsSectionProps) {
  const { t } = useTranslation(); // Rule 2
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const { data: documents, isLoading } = useUserDocumentsByUserId(userId);
  const createDocument = useCreateUserDocument();
  const deleteDocument = useDeleteUserDocument();
  const verifyDocument = useVerifyDocument();
  const unverifyDocument = useUnverifyDocument();

  const handleUpload = async (values: {
    document_type: DocumentType;
    document_name: string;
    document_number?: string;
    issuing_authority?: string;
    issue_date?: dayjs.Dayjs;
    expiry_date?: dayjs.Dayjs;
    notes?: string;
  }) => {
    if (fileList.length === 0) {
      message.error(t('userDocuments.pleaseSelectFileToUpload')); // Rule 5
      return;
    }

    // In a real application, you would upload the file to a storage service (S3, etc.)
    // and get the file_url. For now, we'll use a placeholder.
    const file = fileList[0];
    const fileUrl = `https://example.com/uploads/${file.name}`;

    await createDocument.mutateAsync({
      user_id: userId,
      document_type: values.document_type,
      document_name: values.document_name,
      file_url: fileUrl,
      file_type: file.type,
      file_size: file.size,
      document_number: values.document_number,
      issuing_authority: values.issuing_authority,
      issue_date: values.issue_date?.toISOString(),
      expiry_date: values.expiry_date?.toISOString(),
      notes: values.notes,
    });

    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  const handleDelete = async (id: string) => {
    showConfirmDialog({
      title: t('userDocuments.deleteDocumentTitle'), // Rule 5
      content: t('userDocuments.deleteDocumentConfirmContent'), // Rule 5
      onOk: async () => {
        await deleteDocument.mutateAsync(id);
      },
      danger: true,
    });
  };

  const handleVerify = async (id: string) => {
    await verifyDocument.mutateAsync(id);
  };

  const handleUnverify = async (id: string) => {
    await unverifyDocument.mutateAsync(id);
  };

  const columns: ColumnsType<UserDocument> = [
    {
      title: t('userDocuments.columns.type'), // Rule 5
      dataIndex: 'document_type',
      key: 'document_type',
      render: (type: DocumentType) => {
        const option = documentTypeOptions.find((opt) => opt.value === type);
        return <Tag color="blue">{option ? t(option.labelKey) : type}</Tag>; // Rule 3
      },
    },
    {
      title: t('userDocuments.columns.name'), // Rule 5
      dataIndex: 'document_name',
      key: 'document_name',
      render: (name: string) => (
        <Space>
          <FileOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: t('userDocuments.columns.documentNumber'), // Rule 5
      dataIndex: 'document_number',
      key: 'document_number',
      render: (val: string) => val || t('userDocuments.notApplicable'), // Rule 5
    },
    {
      title: t('userDocuments.columns.issuingAuthority'), // Rule 5
      dataIndex: 'issuing_authority',
      key: 'issuing_authority',
      render: (val: string) => val || t('userDocuments.notApplicable'), // Rule 5
    },
    {
      title: t('userDocuments.columns.issueDate'), // Rule 5
      dataIndex: 'issue_date',
      key: 'issue_date',
      render: (val: string) => (val ? formatDateTime(val) : t('userDocuments.notApplicable')), // Rule 5
    },
    {
      title: t('userDocuments.columns.expiryDate'), // Rule 5
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (val: string) => {
        if (!val) return t('userDocuments.notApplicable'); // Rule 5
        const isExpired = dayjs(val).isBefore(dayjs());
        const isExpiringSoon = dayjs(val).diff(dayjs(), 'days') <= 30;
        return (
          <span style={{ color: isExpired ? 'red' : isExpiringSoon ? 'orange' : undefined }}>
            {formatDateTime(val)}
            {isExpired && ` (${t('userDocuments.status.expired')})`} {/* Rule 5 */}
            {!isExpired && isExpiringSoon && ` (${t('userDocuments.status.expiringSoon')})`} {/* Rule 5 */}
          </span>
        );
      },
    },
    {
      title: t('userDocuments.columns.verified'), // Rule 5
      dataIndex: 'is_verified',
      key: 'is_verified',
      render: (isVerified: boolean) =>
        isVerified ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            {t('userDocuments.status.verified')} {/* Rule 3 */}
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            {t('userDocuments.status.notVerified')} {/* Rule 3 */}
          </Tag>
        ),
    },
    {
      title: t('userDocuments.columns.actions'), // Rule 5
      key: 'actions',
      render: (_: unknown, record: UserDocument) => (
        <Space size="small">
          <Tooltip title={t('userDocuments.tooltip.download')}> {/* Rule 4 */}
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => window.open(record.file_url, '_blank')}
            />
          </Tooltip>
          <PermissionGuard permission="users:update">
            {record.is_verified ? (
              <Tooltip title={t('userDocuments.tooltip.unverify')}> {/* Rule 4 */}
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  size="small"
                  onClick={() => handleUnverify(record.id)}
                />
              </Tooltip>
            ) : (
              <Tooltip title={t('userDocuments.tooltip.verify')}> {/* Rule 4 */}
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  style={{ color: '#52c41a' }}
                  onClick={() => handleVerify(record.id)}
                />
              </Tooltip>
            )}
          </PermissionGuard>
          <PermissionGuard permission="users:delete">
            <Tooltip title={t('userDocuments.tooltip.delete')}> {/* Rule 4 */}
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={t('userDocuments.cardTitle')} // Rule 4
        extra={
          <PermissionGuard permission="users:update">
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsModalOpen(true)}>
              {t('userDocuments.uploadDocumentButton')} {/* Rule 3 */}
            </Button>
          </PermissionGuard>
        }
      >
        <Table
          columns={columns}
          dataSource={documents || []}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="small"
        />
      </Card>

      <Modal
        title={t('userDocuments.uploadDocumentModalTitle')} // Rule 4
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setFileList([]);
        }}
        onOk={() => form.submit()}
        confirmLoading={createDocument.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item
            name="document_type"
            label={t('userDocuments.form.documentTypeLabel')} // Rule 4
            rules={[{ required: true, message: t('userDocuments.form.documentTypeRequired') }]} // Rule 5
          >
            <Select
              options={documentTypeOptions.map(opt => ({ value: opt.value, label: t(opt.labelKey) }))}
              placeholder={t('userDocuments.form.documentTypePlaceholder')} // Rule 4
            />
          </Form.Item>

          <Form.Item
            name="document_name"
            label={t('userDocuments.form.documentNameLabel')} // Rule 4
            rules={[{ required: true, message: t('userDocuments.form.documentNameRequired') }]} // Rule 5
          >
            <Input placeholder={t('userDocuments.form.documentNamePlaceholder')} /> {/* Rule 4 */}
          </Form.Item>

          <Form.Item label={t('userDocuments.form.fileLabel')} required> {/* Rule 4 */}
            <Upload
              beforeUpload={(file) => {
                setFileList([file]);
                return false;
              }}
              fileList={fileList}
              onRemove={() => setFileList([])}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>{t('userDocuments.form.selectFileButton')}</Button> {/* Rule 3 */}
            </Upload>
          </Form.Item>

          <Form.Item name="document_number" label={t('userDocuments.form.documentNumberLabel')}> {/* Rule 4 */}
            <Input placeholder={t('userDocuments.form.documentNumberPlaceholder')} /> {/* Rule 4 */}
          </Form.Item>

          <Form.Item name="issuing_authority" label={t('userDocuments.form.issuingAuthorityLabel')}> {/* Rule 4 */}
            <Input placeholder={t('userDocuments.form.issuingAuthorityPlaceholder')} /> {/* Rule 4 */}
          </Form.Item>

          <Form.Item name="issue_date" label={t('userDocuments.form.issueDateLabel')}> {/* Rule 4 */}
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expiry_date" label={t('userDocuments.form.expiryDateLabel')}> {/* Rule 4 */}
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label={t('userDocuments.form.notesLabel')}> {/* Rule 4 */}
            <Input.TextArea rows={3} placeholder={t('userDocuments.form.notesPlaceholder')} /> {/* Rule 4 */}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}