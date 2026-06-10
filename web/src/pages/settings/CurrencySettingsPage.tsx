import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSetting, useUpsertSetting } from '@/hooks/use-settings';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { useNotificationStore } from '@/store/notification.store';

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  is_default: boolean;
}

const DEFAULT_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, is_default: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.0, is_default: false },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, is_default: false },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED ', rate: 3.67, is_default: false },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR ', rate: 3.75, is_default: false },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR ', rate: 3.64, is_default: false },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD ', rate: 0.31, is_default: false },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR ', rate: 0.385, is_default: false },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD ', rate: 0.377, is_default: false },
];

export default function CurrencySettingsPage() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CurrencyItem | null>(null);
  const [form] = Form.useForm();
  const addNotification = useNotificationStore((s) => s.add);

  // Fetch setting key
  const { data: settingData, isLoading } = useSetting('currency_settings');
  const upsertMutation = useUpsertSetting();

  const [currencies, setCurrencies] = useState<CurrencyItem[]>(DEFAULT_CURRENCIES);

  useEffect(() => {
    if (settingData?.value?.list) {
      setCurrencies(settingData.value.list as CurrencyItem[]);
    }
  }, [settingData]);

  const saveCurrencies = async (newList: CurrencyItem[]) => {
    await upsertMutation.mutateAsync({
      key: 'currency_settings',
      category: 'general',
      value: { list: newList },
    });
    setCurrencies(newList);
  };

  const handleCreateOrEdit = (record?: CurrencyItem) => {
    if (record) {
      setEditingItem(record);
      form.setFieldsValue(record);
    } else {
      setEditingItem(null);
      form.resetFields();
      form.setFieldsValue({ rate: 1.0, is_default: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: CurrencyItem) => {
    let newList = [...currencies];

    if (editingItem) {
      // Edit existing currency (match by code)
      newList = newList.map((item) =>
        item.code === editingItem.code ? { ...item, ...values } : item
      );
    } else {
      // Check for duplicate code
      if (newList.some((c) => c.code.toUpperCase() === values.code.toUpperCase())) {
        addNotification({
          type: 'error',
          message: t('settings.currency.duplicateCode', 'A currency with this code already exists.'),
        });
        return;
      }
      newList.push({ ...values, code: values.code.toUpperCase() });
    }

    // If marked default, toggle off default status for others
    if (values.is_default) {
      newList = newList.map((item) => ({
        ...item,
        is_default: item.code.toUpperCase() === values.code.toUpperCase(),
      }));
    } else if (editingItem?.is_default) {
      // If we unchecked the default of a currency that WAS default, enforce at least one default (this item or USD)
      const hasDefault = newList.some((item) => item.is_default);
      if (!hasDefault) {
        newList = newList.map((item, idx) =>
          idx === 0 ? { ...item, is_default: true } : item
        );
      }
    }

    await saveCurrencies(newList);
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = (record: CurrencyItem) => {
    if (record.is_default) {
      addNotification({
        type: 'error',
        message: t('settings.currency.cannotDeleteDefault', 'Cannot delete the default currency.'),
      });
      return;
    }

    showConfirmDialog({
      title: t('settings.currency.deleteTitle', 'Delete Currency'),
      content: t('settings.currency.deleteConfirm', {
        name: `${record.name} (${record.code})`,
      }),
      onOk: async () => {
        const newList = currencies.filter((item) => item.code !== record.code);
        await saveCurrencies(newList);
      },
      danger: true,
    });
  };

  const handleSetDefault = async (record: CurrencyItem) => {
    const newList = currencies.map((item) => ({
      ...item,
      is_default: item.code === record.code,
    }));
    await saveCurrencies(newList);
  };

  const columns: ColumnsType<CurrencyItem> = [
    {
      title: t('settings.currency.colCode', 'Code'),
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
          {code} {record.is_default && <Tag color="blue">{t('settings.currency.default', 'Default')}</Tag>}
        </span>
      ),
    },
    {
      title: t('settings.currency.colName', 'Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('settings.currency.colSymbol', 'Symbol'),
      dataIndex: 'symbol',
      key: 'symbol',
      render: (sym) => <code style={{ fontSize: 14 }}>{sym}</code>,
    },
    {
      title: t('settings.currency.colRate', 'Exchange Rate'),
      dataIndex: 'rate',
      key: 'rate',
      render: (rate) => `${rate} (1 base)`,
    },
    {
      title: t('settings.currency.colActions', 'Actions'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {!record.is_default && (
            <Tooltip title={t('settings.currency.setDefault', 'Set as Default')}>
              <Button
                type="text"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleSetDefault(record)}
              />
            </Tooltip>
          )}
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleCreateOrEdit(record)}
            />
          </Tooltip>
          {!record.is_default && (
            <Tooltip title={t('common.delete', 'Delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {t('settings.currency.title', 'Currencies')}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0', maxWidth: 650 }}>
            Manage and configure international transaction currencies and dynamic exchange rates. Establish localized pricing models, assign billing priorities, and support multi-currency formatting on client estimates and invoices.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleCreateOrEdit()}
        >
          {t('settings.currency.addBtn', 'Add Currency')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={currencies}
        rowKey="code"
        loading={isLoading}
        pagination={false}
      />

      <Modal
        title={
          editingItem
            ? t('settings.currency.editTitle', 'Edit Currency')
            : t('settings.currency.createTitle', 'Add Currency')
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={upsertMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="code"
            label={t('settings.currency.formCode', 'Currency Code (e.g. USD)')}
            rules={[
              { required: true, message: t('settings.currency.requiredCode', 'Please input the code') },
              { max: 3, message: t('settings.currency.maxLengthCode', 'Max 3 characters') },
            ]}
          >
            <Input placeholder="USD" disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('settings.currency.formName', 'Currency Name')}
            rules={[{ required: true, message: t('settings.currency.requiredName', 'Please input the name') }]}
          >
            <Input placeholder="US Dollar" />
          </Form.Item>

          <Form.Item
            name="symbol"
            label={t('settings.currency.formSymbol', 'Symbol')}
            rules={[{ required: true, message: t('settings.currency.requiredSymbol', 'Please input the symbol') }]}
          >
            <Input placeholder="$" style={{ maxWidth: 100 }} />
          </Form.Item>

          <Form.Item
            name="rate"
            label={t('settings.currency.formRate', 'Exchange Rate')}
            rules={[{ required: true, message: t('settings.currency.requiredRate', 'Please input the exchange rate') }]}
          >
            <InputNumber min={0.0001} step={0.01} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="is_default"
            label={t('settings.currency.formDefault', 'Set as Default')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
