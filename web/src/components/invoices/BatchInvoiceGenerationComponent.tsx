import { useState } from 'react';
import {
  Modal,
  Table,
  Button,
  Space,
  Checkbox,
  Tag,
  Alert,
  Progress,
  Steps,
  DatePicker,
  Select,
  Form,
  InputNumber,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

interface WorkOrderForInvoicing {
  id: string;
  wo_number: string;
  customer_name: string;
  service_date: string;
  total_amount: number;
  status: string;
  has_invoice: boolean;
}

interface BatchInvoiceGenerationProps {
  visible: boolean;
  onClose: () => void;
  onGenerate?: (workOrderIds: string[], dueDate: string) => Promise<void>;
}

export default function BatchInvoiceGenerationComponent({
  visible,
  onClose,
  onGenerate,
}: BatchInvoiceGenerationProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [dueDate, setDueDate] = useState<dayjs.Dayjs>(dayjs().add(30, 'days'));
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [form] = Form.useForm();

  // Mock data - replace with actual API call
  const workOrders: WorkOrderForInvoicing[] = [
    {
      id: '1',
      wo_number: 'WO-2024-001',
      customer_name: 'ABC Company',
      service_date: '2024-02-15T10:00:00Z',
      total_amount: 1250.0,
      status: 'Completed',
      has_invoice: false,
    },
    {
      id: '2',
      wo_number: 'WO-2024-002',
      customer_name: 'XYZ Corp',
      service_date: '2024-02-16T14:00:00Z',
      total_amount: 850.0,
      status: 'Completed',
      has_invoice: false,
    },
    {
      id: '3',
      wo_number: 'WO-2024-003',
      customer_name: 'Smith Industries',
      service_date: '2024-02-17T09:00:00Z',
      total_amount: 2100.0,
      status: 'Completed',
      has_invoice: true,
    },
  ];

  const eligibleWorkOrders = workOrders.filter((wo) => !wo.has_invoice);

  const columns: ColumnsType<WorkOrderForInvoicing> = [
    {
      title: t('batchInvoice.columns.workOrder'),
      dataIndex: 'wo_number',
      key: 'wo_number',
      render: (number: string) => <Tag color="blue">{number}</Tag>,
    },
    {
      title: t('batchInvoice.columns.customer'),
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: t('batchInvoice.columns.serviceDate'),
      dataIndex: 'service_date',
      key: 'service_date',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('batchInvoice.columns.amount'),
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: t('batchInvoice.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'success' : 'processing'}>{status}</Tag>
      ),
    },
    {
      title: t('batchInvoice.columns.invoice'),
      dataIndex: 'has_invoice',
      key: 'has_invoice',
      render: (hasInvoice: boolean) =>
        hasInvoice ? (
          <Tag color="success">
            <CheckCircleOutlined /> {t('batchInvoice.status.invoiced')}
          </Tag>
        ) : (
          <Tag color="default">
            <WarningOutlined /> {t('batchInvoice.status.pending')}
          </Tag>
        ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: WorkOrderForInvoicing) => ({
      disabled: record.has_invoice,
    }),
  };

  const handleNext = () => {
    if (currentStep === 0 && selectedRowKeys.length === 0) {
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationProgress(0);

    try {
      const workOrderIds = selectedRowKeys as string[];
      const total = workOrderIds.length;

      for (let i = 0; i < total; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setGenerationProgress(((i + 1) / total) * 100);
        setGeneratedCount(i + 1);
      }

      if (onGenerate) {
        await onGenerate(workOrderIds, dueDate.format('YYYY-MM-DD'));
      }

      setCurrentStep(2);
    } catch (error) {
      console.error(t('batchInvoice.errors.generationFailed'), error);
    } finally {
      setGenerating(false);
    }
  };

  const handleFinish = () => {
    setCurrentStep(0);
    setSelectedRowKeys([]);
    setGenerationProgress(0);
    setGeneratedCount(0);
    onClose();
  };

  const totalAmount = eligibleWorkOrders
    .filter((wo) => selectedRowKeys.includes(wo.id))
    .reduce((sum, wo) => sum + wo.total_amount, 0);

  return (
    <Modal
      title={t('batchInvoice.title')}
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={[
          { title: t('batchInvoice.steps.selectWorkOrders'), icon: <FileTextOutlined /> },
          { title: t('batchInvoice.steps.configureSettings'), icon: <CheckCircleOutlined /> },
          { title: t('batchInvoice.steps.generateInvoices'), icon: <LoadingOutlined /> },
        ]}
      />

      {currentStep === 0 && (
        <div>
          <Alert
            message={t('batchInvoice.alerts.foundWorkOrders', { count: eligibleWorkOrders.length })}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space style={{ marginBottom: 16 }}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
            <Button onClick={() => setSelectedRowKeys(eligibleWorkOrders.map((wo) => wo.id))}>
              {t('batchInvoice.buttons.selectAllEligible')}
            </Button>
            <Button onClick={() => setSelectedRowKeys([])}>{t('batchInvoice.buttons.clearSelection')}</Button>
          </Space>

          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={eligibleWorkOrders}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{t('batchInvoice.labels.selectedCount', { count: selectedRowKeys.length })}</strong>
              {selectedRowKeys.length > 0 && (
                <span style={{ marginLeft: 16, color: '#52c41a' }}>
                  {t('batchInvoice.labels.total', { amount: formatCurrency(totalAmount) })}
                </span>
              )}
            </div>
            <Space>
              <Button onClick={onClose}>{t('batchInvoice.buttons.cancel')}</Button>
              <Button
                type="primary"
                onClick={handleNext}
                disabled={selectedRowKeys.length === 0}
              >
                {t('batchInvoice.buttons.next')}
              </Button>
            </Space>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <Alert
            message={t('batchInvoice.alerts.generatingCount', { count: selectedRowKeys.length })}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form form={form} layout="vertical">
            <Form.Item label={t('batchInvoice.fields.dueDate')} required>
              <DatePicker
                value={dueDate}
                onChange={(date) => date && setDueDate(date)}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item label={t('batchInvoice.fields.paymentTerms')} initialValue={30}>
              <Select>
                <Select.Option value={0}>{t('batchInvoice.terms.dueOnReceipt')}</Select.Option>
                <Select.Option value={7}>{t('batchInvoice.terms.net7')}</Select.Option>
                <Select.Option value={15}>{t('batchInvoice.terms.net15')}</Select.Option>
                <Select.Option value={30}>{t('batchInvoice.terms.net30')}</Select.Option>
                <Select.Option value={60}>{t('batchInvoice.terms.net60')}</Select.Option>
                <Select.Option value={90}>{t('batchInvoice.terms.net90')}</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label={t('batchInvoice.fields.lateFee')} initialValue={0}>
              <InputNumber min={0} max={25} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Form>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handlePrevious}>{t('batchInvoice.buttons.previous')}</Button>
            <Space>
              <Button onClick={onClose}>{t('batchInvoice.buttons.cancel')}</Button>
              <Button type="primary" onClick={handleGenerate} loading={generating}>
                {t('batchInvoice.buttons.generateInvoices', { count: selectedRowKeys.length })}
              </Button>
            </Space>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          {generating ? (
            <div>
              <Progress
                type="circle"
                percent={Math.round(generationProgress)}
                status="active"
                strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
              />
              <div style={{ marginTop: 24, fontSize: 16 }}>
                {t('batchInvoice.status.generating')} {generatedCount} / {selectedRowKeys.length}
              </div>
            </div>
          ) : (
            <div>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} />
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                {t('batchInvoice.status.successTitle')}
              </div>
              <div style={{ color: '#8c8c8c', marginBottom: 24 }}>
                {t('batchInvoice.status.successDescription', { count: generatedCount })}
              </div>
              <Space>
                <Button onClick={() => window.location.href = '/invoices'}>
                  {t('batchInvoice.buttons.viewInvoices')}
                </Button>
                <Button type="primary" onClick={handleFinish}>
                  {t('batchInvoice.buttons.done')}
                </Button>
              </Space>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}