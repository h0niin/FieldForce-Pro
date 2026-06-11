import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Modal,
  Divider,
  Tag,
  Spin,
  Empty,
  Typography,
  Alert,
  Tooltip,
  Badge,
  message,
  Radio,
} from 'antd';
import {
  SaveOutlined,
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined,
  LinkOutlined,
  AppstoreOutlined,
  ToolOutlined,
  FormOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dayjs from 'dayjs';
import PageHeader from '@/components/common/PageHeader';
import {
  useEstimate,
  useCreateEstimate,
  useUpdateEstimate,
  useSendEstimate,
  useEstimateAssignedCreator,
  useSubmitForInternalApproval,
} from '@/hooks/use-estimates';
import { usePermission } from '@/components/permissions/usePermission';
import { useAuthStore } from '@/store/auth.store';
import { useAllContacts } from '@/hooks/use-contacts';
import { useServiceRequest } from '@/hooks/use-service-requests';
import { useAllServiceLocations } from '@/hooks/use-service-locations';
import { useEstimateLineItems, useCreateEstimateLineItem } from '@/hooks/use-estimate-line-items';
import { useAllServicesCatalog } from '@/hooks/use-services-catalog';
import { useAllPartsCatalog } from '@/hooks/use-parts-catalog';
import type { LineItemType } from '@/api/estimate-line-items.api';
import { useUiStore } from '@/store/ui.store';
import type { EstimateLineItem, ServiceCatalogItem, PartsCatalogItem, ServiceLocation } from '@/types/models.types';

const { TextArea } = Input;
const { Text } = Typography;

type ItemSource = 'service' | 'part' | 'manual';

const LINE_ITEM_TYPE_META: Record<string, { color: string }> = {
  service:   { color: 'blue'    },
  part:      { color: 'green'   },
  labor:     { color: 'purple'  },
  material:  { color: 'cyan'    },
  equipment: { color: 'gold'    },
  travel:    { color: 'orange'  },
  other:     { color: 'default' },
};

const MANUAL_TYPES = [
  { value: 'service'   },
  { value: 'part'      },
  { value: 'labor'     },
  { value: 'material'  },
  { value: 'equipment' },
  { value: 'travel'    },
  { value: 'other'     },
];

const UNITS = ['each', 'hrs', 'days', 'sqft', 'sqm', 'lm', 'kg', 'lot', 'visit', 'month'];

const PRIORITIES = [
  { value: 'low',    dot: '#6b7280' },
  { value: 'medium', dot: '#2563eb' },
  { value: 'high',   dot: '#f59e0b' },
  { value: 'urgent', dot: '#ef4444' },
];

interface LineItemFormData extends Partial<EstimateLineItem> {
  tempId?: string;
  unit?: string;
}

// ─── Sortable Row ─────────────────────────────────────────────────────────────

function SortableLineItemRow({
  item, index, onEdit, onDelete, borderColor,
}: {
  item: LineItemFormData;
  index: number;
  onEdit: (i: number) => void;
  onDelete: (i: number) => void;
  borderColor: string;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.tempId || item.id || `item-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const qty      = Number(item.quantity)   || 0;
  const price    = Number(item.unit_price) || 0;
  const discType = item.discount_type || 'fixed';
  const discVal  = Number(item.discount)   || 0;
  const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;
  const tax      = Number(item.tax_rate)   || 0;
  const lineBase = qty * price - discAmt;
  const lineTotal = lineBase + lineBase * (tax / 100);
  const typeMeta = LINE_ITEM_TYPE_META[item.type || 'other'] || LINE_ITEM_TYPE_META['other'];

  return (
    <tr ref={setNodeRef} style={{ ...style, borderBottom: `1px solid ${borderColor}` }}>
      <td style={{ width: 36, textAlign: 'center', cursor: 'grab', color: '#9ca3af', padding: '10px 6px' }}
        {...attributes} {...listeners}>
        <DragOutlined />
      </td>
      <td style={{ padding: '10px 8px', width: 110 }}>
        <Tag color={typeMeta.color} style={{ fontSize: 11, margin: 0 }}>
          {t(`estimateBuilder.types.${item.type || 'other'}`)}
        </Tag>
      </td>
      <td style={{ padding: '10px 8px' }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</div>
        {item.description && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{item.description}</div>
        )}
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'center', width: 80 }}>
        <span style={{ fontSize: 13 }}>{qty}</span>
        {item.unit && <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 3 }}>{t(`estimateBuilder.units.${item.unit}`, { defaultValue: item.unit })}</span>}
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'right', width: 100, fontSize: 13 }}>
        ${price.toFixed(2)}
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'right', width: 70, fontSize: 13 }}>
        {tax > 0 ? `${tax}%` : <Text type="secondary">—</Text>}
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'right', width: 90, fontSize: 13 }}>
        {discAmt > 0 ? <Text style={{ color: '#ef4444' }}>{discType === 'percentage' ? `${discVal}%` : `-$${discAmt.toFixed(2)}`}</Text> : <Text type="secondary">—</Text>}
      </td>
      <td style={{ padding: '10px 8px', textAlign: 'right', width: 105, fontWeight: 600, fontSize: 13 }}>
        ${lineTotal.toFixed(2)}
      </td>
      <td style={{ padding: '10px 8px', width: 72 }}>
        <Space size={2}>
          <Tooltip title={t('estimateBuilder.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(index)} />
          </Tooltip>
          <Tooltip title={t('estimateBuilder.remove')}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(index)} />
          </Tooltip>
        </Space>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EstimateBuilderPage() {
  const { t } = useTranslation();
  const navigate         = useNavigate();
  const { id }           = useParams<{ id: string }>();
  const [searchParams]   = useSearchParams();
  const serviceRequestId = searchParams.get('service_request_id');
  const estimateTypeParam  = searchParams.get('estimate_type') || 'pre_visit';
  const theme            = useUiStore((s) => s.theme);
  const { isAdmin }      = usePermission();
  const currentUser      = useAuthStore((s) => s.user);

  const [form]         = Form.useForm();
  const [lineItemForm] = Form.useForm();
  const isEdit = !!id;

  const { data: estimate, isLoading }  = useEstimate(id || '');
  const { data: existingLineItems }    = useEstimateLineItems(isEdit ? (id || '') : '');
  // In create mode: use URL query param. In edit mode: fall back to estimate.request_id
  const srIdToFetch = serviceRequestId || (isEdit && estimate?.request_id ? estimate.request_id : '');
  const { data: linkedSR }             = useServiceRequest(srIdToFetch);
  const { data: servicesCatalog = [] } = useAllServicesCatalog();
  const { data: partsCatalog    = [] } = useAllPartsCatalog();
  const { data: allLocations = [] }    = useAllServiceLocations();
  const { data: assignedCreatorId }    = useEstimateAssignedCreator();

  // Guard: only assigned creator or admin can create new estimates
  useEffect(() => {
    if (!isEdit && assignedCreatorId !== undefined && !isAdmin && currentUser?.id !== assignedCreatorId) {
      message.error(t('estimateBuilder.errors.assignedEstimatorOnly'));
      navigate('/estimates');
    }
  }, [isEdit, assignedCreatorId, isAdmin, currentUser?.id, navigate, t]);

  // Build location options: merge fetched list + SR's embedded location so the
  // dropdown always has at least the SR's location even if allLocations is empty.
  const locationOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = (allLocations as ServiceLocation[]).map((loc) => ({
      value: loc.id,
      label: loc.address,
    }));
    // If the linked SR carries a location object not already in the list, prepend it.
    if (linkedSR?.location && !opts.find((o) => o.value === linkedSR.location!.id)) {
      opts.unshift({ value: linkedSR.location.id, label: linkedSR.location.address });
    }
    return opts;
  }, [allLocations, linkedSR]);

  const createEstimate          = useCreateEstimate();
  const updateEstimate          = useUpdateEstimate();
  const sendEstimate            = useSendEstimate();
  const submitForInternalApproval = useSubmitForInternalApproval();
  const createLineItem          = useCreateEstimateLineItem();
  const isOnSite                = estimateTypeParam === 'on_site';
  const { data: contacts } = useAllContacts();

  const [lineItems,    setLineItems]    = useState<LineItemFormData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemSource,   setItemSource]   = useState<ItemSource>('service');
  const [isSaving,     setIsSaving]     = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const borderColor = theme === 'dark' ? '#303030' : '#f0f0f0';
  const cardBg      = theme === 'dark' ? '#141414' : '#fff';
  const mutedBg     = theme === 'dark' ? '#1f1f1f' : '#f9fafb';

  useEffect(() => {
    if (linkedSR && !isEdit) {
      form.setFieldsValue({
        contact_id: linkedSR.contact_id,
        title: `${t('estimateBuilder.estimateFor')}: ${linkedSR.subject || t('estimateBuilder.defaultTitle')}`,
        scheduled_start: linkedSR.scheduled_start ? dayjs(linkedSR.scheduled_start) : null,
        location_id: linkedSR.location_id || null,
      });
    }
  }, [linkedSR, isEdit, form, t]);

  useEffect(() => {
    if (estimate && isEdit) {
      const cf = (estimate.custom_fields as Record<string, unknown>) || {};
      // Fall back to linked SR for scheduled dates if not set on the estimate
      const scheduledStart = estimate.scheduled_start
        ? dayjs(estimate.scheduled_start)
        : (linkedSR?.scheduled_start ? dayjs(linkedSR.scheduled_start) : null);
      form.setFieldsValue({
        contact_id:            estimate.contact_id,
        title:                 cf.title || '',
        expiry_date:           estimate.expiry_date ? dayjs(estimate.expiry_date) : null,
        scheduled_start:       scheduledStart,
        priority:              cf.priority || undefined,
        notes:                 estimate.notes || '',
        terms_and_conditions:  (cf.terms_and_conditions as string) || '',
        location_id:           (cf.location_id as string) || linkedSR?.location_id || null,
      });
    }
  }, [estimate, isEdit, form, linkedSR]);

  useEffect(() => {
    const source =
      existingLineItems && existingLineItems.length > 0
        ? existingLineItems
        : estimate?.line_items && estimate.line_items.length > 0
          ? estimate.line_items : null;
    if (source && isEdit) {
      setLineItems(
        [...source]
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((item) => ({ ...item, tempId: item.id })),
      );
    }
  }, [existingLineItems, estimate?.line_items, isEdit]);

  const subtotal = lineItems.reduce((sum, item) => {
    const qty   = Number(item.quantity)   || 0;
    const price = Number(item.unit_price) || 0;
    const discType = item.discount_type || 'fixed';
    const discVal  = Number(item.discount) || 0;
    const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;
    return sum + (qty * price) - discAmt;
  }, 0);
  const totalTax = lineItems.reduce((sum, item) => {
    const qty   = Number(item.quantity)   || 0;
    const price = Number(item.unit_price) || 0;
    const discType = item.discount_type || 'fixed';
    const discVal  = Number(item.discount) || 0;
    const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;
    const base = (qty * price) - discAmt;
    return sum + base * ((Number(item.tax_rate) || 0) / 100);
  }, 0);
  const totalDiscount = lineItems.reduce((sum, item) => {
    const qty   = Number(item.quantity)   || 0;
    const price = Number(item.unit_price) || 0;
    const discType = item.discount_type || 'fixed';
    const discVal  = Number(item.discount) || 0;
    const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;
    return sum + discAmt;
  }, 0);
  const grandTotal    = subtotal + totalTax;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLineItems((items) => {
        const oldIdx = items.findIndex((i) => (i.tempId || i.id) === active.id);
        const newIdx = items.findIndex((i) => (i.tempId || i.id) === over.id);
        return arrayMove(items, oldIdx, newIdx).map((item, idx) => ({ ...item, sort_order: idx }));
      });
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    setItemSource('service');
    lineItemForm.resetFields();
    lineItemForm.setFieldsValue({ quantity: 1, unit: 'each', unit_price: 0, tax_rate: 0, discount_type: 'fixed', discount: 0 });
    setModalVisible(true);
  };

  const openEdit = (index: number) => {
    const item = lineItems[index];
    setEditingIndex(index);
    setItemSource(item.type === 'service' ? 'service' : item.type === 'part' ? 'part' : 'manual');
    lineItemForm.resetFields();
    lineItemForm.setFieldsValue(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    lineItemForm.resetFields();
  };

  const confirmDelete = (index: number) => {
    Modal.confirm({
      title: t('estimateBuilder.removeLineItemTitle'),
      content: t('estimateBuilder.removeLineItemContent'),
      okText: t('estimateBuilder.remove'), okType: 'danger',
      onOk: () => setLineItems((items) => items.filter((_, i) => i !== index)),
    });
  };

  const saveLineItem = () => {
    lineItemForm
      .validateFields()
      .then((values) => {
        const resolvedType =
          itemSource === 'service' ? 'service' :
          itemSource === 'part'    ? 'part'    :
          String(values.type || 'other');

        const qty   = Number(values.quantity)   || 0;
        const price = Number(values.unit_price) || 0;
        const discType = values.discount_type || 'fixed';
        const discVal  = Number(values.discount)   || 0;
        const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;

        const entry: LineItemFormData = {
          ...values,
          type:       resolvedType,
          discount_type: discType,
          tempId:     editingIndex !== null ? lineItems[editingIndex].tempId : `temp-${Date.now()}`,
          sort_order: editingIndex !== null ? lineItems[editingIndex].sort_order : lineItems.length,
          total:      qty * price - discAmt,
        };

        if (editingIndex !== null) {
          setLineItems((items) => items.map((li, i) => (i === editingIndex ? entry : li)));
        } else {
          setLineItems((prev) => [...prev, entry]);
        }
        closeModal();
      })
      .catch(() => {
        // Validation errors shown inline by antd
      });
  };

  const doSave = useCallback(
    async (sendForReview = false) => {
      let values: Record<string, unknown>;
      try { values = await form.validateFields(); } catch { return; }

      if (lineItems.length === 0) {
        message.error(t('estimateBuilder.errors.atLeastOneLineItem'));
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          contact_id:     values.contact_id as string,
          request_id:     (serviceRequestId || estimate?.request_id) ?? undefined,
          work_order_id:  (searchParams.get('work_order_id') || estimate?.work_order_id) ?? undefined,
          estimate_type:  isEdit ? undefined : estimateTypeParam,
          expiry_date:    values.expiry_date ? (values.expiry_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
          scheduled_start: values.scheduled_start ? (values.scheduled_start as dayjs.Dayjs).toISOString() : undefined,
          notes:          (values.notes as string) || undefined,
          subtotal, tax: totalTax, discount: totalDiscount, total: grandTotal,
          custom_fields: {
            title:                (values.title as string) || '',
            priority:             (values.priority as string) || '',
            terms_and_conditions: (values.terms_and_conditions as string) || '',
            location_id:          (values.location_id as string) || '',
          },
          is_template: false,
        };

        let estimateId: string | undefined = id;
        if (isEdit) {
          await updateEstimate.mutateAsync({ id: id!, ...payload });
        } else {
          const res = await createEstimate.mutateAsync(payload);
          estimateId = (res.data?.data as { id?: string } | undefined)?.id;
        }

        if (!estimateId) { message.error(t('estimateBuilder.errors.noId')); return; }

        for (const item of lineItems.filter((i) => !i.id)) {
          const qty      = Number(item.quantity)   || 1;
          const price    = Number(item.unit_price) || 0;
          const discType = item.discount_type || 'fixed';
          const discVal  = Number(item.discount)   || 0;
          const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;
          const taxRate  = Number(item.tax_rate)   || 0;
          const lineBase = qty * price - discAmt;
          await createLineItem.mutateAsync({
            estimate_id: estimateId,
            type:        (String(item.type || 'service')) as LineItemType,
            name:        String(item.name || ''),
            description: item.description ?? undefined,
            quantity:    qty,
            unit:        item.unit,
            unit_price:  price,
            tax_rate:    taxRate,
            discount_type: discType,
            discount:    discVal,
            total:       lineBase + lineBase * (taxRate / 100),
            sort_order:  item.sort_order || 0,
          });
        }

        // Send for review: transition status from draft → sent
        if (sendForReview) {
          await sendEstimate.mutateAsync(estimateId);
        }

        navigate('/estimates');
      } catch (err: unknown) {
        message.error((err as { message?: string })?.message || t('estimateBuilder.errors.failedToSave'));
      } finally {
        setIsSaving(false);
      }
    },
    [form, lineItems, subtotal, totalTax, totalDiscount, grandTotal,
     serviceRequestId, estimate, id, isEdit,
     updateEstimate, createEstimate, sendEstimate, createLineItem, navigate, t],
  );

  const doSaveAsTemplate = async () => {
    if (!templateName) {
      message.error('Template name is required');
      return;
    }

    let values: Record<string, unknown>;
    try { values = await form.validateFields(); } catch { return; }

    setIsSaving(true);
    try {
      const payload = {
        contact_id:     values.contact_id as string,
        request_id:     (serviceRequestId || estimate?.request_id) ?? undefined,
        work_order_id:  (searchParams.get('work_order_id') || estimate?.work_order_id) ?? undefined,
        estimate_type:  isEdit ? undefined : estimateTypeParam,
        expiry_date:    values.expiry_date ? (values.expiry_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
        scheduled_start: values.scheduled_start ? (values.scheduled_start as dayjs.Dayjs).toISOString() : undefined,
        notes:          (values.notes as string) || undefined,
        subtotal, tax: totalTax, discount: totalDiscount, total: grandTotal,
        custom_fields: {
          title:                (values.title as string) || '',
          priority:             (values.priority as string) || '',
          terms_and_conditions: (values.terms_and_conditions as string) || '',
          location_id:          (values.location_id as string) || '',
        },
        is_template: true,
        template_name: templateName,
      };

      const res = await createEstimate.mutateAsync(payload);
      const estimateId = (res.data?.data as { id?: string } | undefined)?.id;

      if (!estimateId) { message.error(t('estimateBuilder.errors.noId')); return; }

      for (const item of lineItems) {
        const qty      = Number(item.quantity)   || 1;
        const price    = Number(item.unit_price) || 0;
        const discType = item.discount_type || 'fixed';
        const discVal  = Number(item.discount)   || 0;
        const discAmt  = discType === 'percentage' ? (qty * price) * (discVal / 100) : discVal;
        const taxRate  = Number(item.tax_rate)   || 0;
        const lineBase = qty * price - discAmt;
        await createLineItem.mutateAsync({
          estimate_id: estimateId,
          type:        (String(item.type || 'service')) as LineItemType,
          name:        String(item.name || ''),
          description: item.description ?? undefined,
          quantity:    qty,
          unit:        item.unit,
          unit_price:  price,
          tax_rate:    taxRate,
          discount_type: discType,
          discount:    discVal,
          total:       lineBase + lineBase * (taxRate / 100),
          sort_order:  item.sort_order || 0,
        });
      }

      message.success('Estimate saved as template');
      setTemplateModalVisible(false);
      navigate('/estimates?tab=templates');
    } catch (err: unknown) {
      message.error((err as { message?: string })?.message || t('estimateBuilder.errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  const activeSvcOptions = (servicesCatalog as ServiceCatalogItem[])
    .filter((s) => s.is_active)
    .map((s) => ({ value: s.id, label: s.category ? `${s.name} — ${s.category}` : s.name }));

  const activePartOptions = (partsCatalog as PartsCatalogItem[])
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: p.sku ? `${p.name} (${p.sku})` : p.name }));

  return (
    <div>
      <PageHeader
        title={isEdit ? t('estimateBuilder.createEstimate') : t('estimateBuilder.newEstimate')}
        subtitle={isEdit ? t('estimateBuilder.subtitleEdit') : t('estimateBuilder.subtitleCreate')}
        onBack={() => navigate('/estimates')}
        extra={
          <Space>
            <Button onClick={() => navigate('/estimates')}>{t('estimateBuilder.cancel')}</Button>
            <Button onClick={() => setTemplateModalVisible(true)} loading={isSaving}>
              Save as Template
            </Button>
            <Button icon={<SaveOutlined />} onClick={() => doSave(false)} loading={isSaving}>
              {t('estimateBuilder.saveDraft')}
            </Button>
            {isOnSite ? (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isSaving || submitForInternalApproval.isPending}
                onClick={async () => {
                  const savedRes = await doSave(false) as unknown as { id?: string } | undefined;
                  const newId = savedRes?.id || id;
                  if (newId) submitForInternalApproval.mutate(newId);
                }}
              >
                Submit for Manager Approval
              </Button>
            ) : (
              <Button type="primary" icon={<SendOutlined />} onClick={() => doSave(true)} loading={isSaving}>
                {t('estimateBuilder.saveAndSend')}
              </Button>
            )}
          </Space>
        }
      />

      {linkedSR && (
        <Alert type="info" showIcon icon={<LinkOutlined />}
          message={
            <span>
              {t('estimateBuilder.linkedToServiceRequest')}: <Text strong>{linkedSR.subject}</Text>
              {linkedSR.priority && <Tag color="orange" style={{ marginLeft: 8 }}>{linkedSR.priority}</Tag>}
            </span>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical" autoComplete="off" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>

            <Card title={<Space><UserOutlined /><span>{t('estimateBuilder.clientReference')}</span></Space>}
              style={{ marginBottom: 16, background: cardBg, borderColor }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="contact_id" label={t('estimateBuilder.customerContact')}
                    rules={[{ required: true, message: t('estimateBuilder.pleaseSelectCustomer') }]}>
                    <Select showSearch optionFilterProp="label" placeholder={t('estimateBuilder.searchCustomer')}
                      options={contacts?.map((c) => ({
                        value: c.id,
                        label: `${c.first_name} ${c.last_name}${c.email ? ` — ${c.email}` : ''}`,
                      })) || []}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="title" label={t('estimateBuilder.estimateTitle')}>
                    <Input placeholder={t('estimateBuilder.titlePlaceholder')} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="scheduled_start" label={t('estimateBuilder.scheduledDate')}>
                    <DatePicker
                      format="YYYY-MM-DD"
                      placeholder={t('estimateBuilder.selectScheduledDate')}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="location_id" label={<Space size={4}><EnvironmentOutlined />{t('estimateBuilder.location')}</Space>}>
                <Select
                  showSearch
                  allowClear
                  placeholder={t('estimateBuilder.selectLocation')}
                  optionFilterProp="label"
                  options={locationOptions}
                />
              </Form.Item>
              {linkedSR && (
                <Form.Item label={t('estimateBuilder.linkedServiceRequest')} style={{ marginBottom: 0 }}>
                  <Input readOnly value={linkedSR.subject || ''}
                    prefix={<LinkOutlined style={{ color: '#6b7280' }} />}
                    style={{ background: mutedBg, color: '#6b7280', cursor: 'default' }} />
                </Form.Item>
              )}
            </Card>

            <Card
              title={<Space><FileTextOutlined /><span>{t('estimateBuilder.lineItems')}</span>{lineItems.length === 0 && <Tag color="error" style={{ marginLeft: 4 }}>{t('estimateBuilder.required')}</Tag>}</Space>}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAdd}>{t('estimateBuilder.addItem')}</Button>}
              style={{ marginBottom: 16, background: cardBg, borderColor: lineItems.length === 0 ? '#ff4d4f' : borderColor }}
            >
              {/* DndContext is ALWAYS mounted to prevent StrictMode remount crash */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={lineItems.map((i) => i.tempId || i.id || '')}
                  strategy={verticalListSortingStrategy}
                >
                  {lineItems.length === 0 ? (
                    <Empty description={t('estimateBuilder.noLineItems')}
                      image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '24px 0' }}>
                      <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>{t('estimateBuilder.addFirstItem')}</Button>
                    </Empty>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${borderColor}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>
                            <th style={{ padding: '8px 6px', width: 36 }} />
                            <th style={{ padding: '8px 8px', textAlign: 'left' }}>{t('estimateBuilder.tableHeaderType')}</th>
                            <th style={{ padding: '8px 8px', textAlign: 'left' }}>{t('estimateBuilder.tableHeaderDescription')}</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center' }}>{t('estimateBuilder.tableHeaderQty')}</th>
                            <th style={{ padding: '8px 8px', textAlign: 'right' }}>{t('estimateBuilder.tableHeaderUnitPrice')}</th>
                            <th style={{ padding: '8px 8px', textAlign: 'right' }}>{t('estimateBuilder.tableHeaderTax')}</th>
                            <th style={{ padding: '8px 8px', textAlign: 'right' }}>{t('estimateBuilder.tableHeaderDisc')}</th>
                            <th style={{ padding: '8px 8px', textAlign: 'right' }}>{t('estimateBuilder.tableHeaderTotal')}</th>
                            <th style={{ padding: '8px 8px', width: 72 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, index) => (
                            <SortableLineItemRow
                              key={item.tempId || item.id || `item-${index}`}
                              item={item} index={index}
                              onEdit={openEdit} onDelete={confirmDelete}
                              borderColor={borderColor}
                            />
                          ))}
                        </tbody>
                      </table>

                      <Divider style={{ margin: '16px 0' }} />

                      <Row justify="end">
                        <Col xs={24} sm={14} md={10}>
                          <div style={{ padding: '0 8px' }}>
                            {[
                              { label: t('estimateBuilder.subtotal'), value: `$${subtotal.toFixed(2)}` },
                              { label: t('estimateBuilder.totalDiscount'), value: totalDiscount > 0 ? `-$${totalDiscount.toFixed(2)}` : '—', color: totalDiscount > 0 ? '#ef4444' : undefined },
                              { label: t('estimateBuilder.tax'), value: `$${totalTax.toFixed(2)}` },
                            ].map(({ label, value, color }) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                                <Text type="secondary">{label}</Text>
                                <Text style={{ color }}>{value}</Text>
                              </div>
                            ))}
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                              <Text strong style={{ fontSize: 14 }}>{t('estimateBuilder.grandTotal')}</Text>
                              <Text strong style={{ fontSize: 20, color: '#2563eb' }}>${grandTotal.toFixed(2)}</Text>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </Card>

            <Card
              title={<Space><FileTextOutlined /><span>{t('estimateBuilder.notes')}</span></Space>}
              style={{ marginBottom: 16, background: cardBg, borderColor }}
            >
              <Form.Item name="notes" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={3}
                  placeholder={t('estimateBuilder.notesPlaceholder')}
                />
              </Form.Item>
            </Card>

            <Card
              title={<Space><FileTextOutlined /><span>{t('estimateBuilder.termsAndConditions')}</span></Space>}
              style={{ marginBottom: 16, background: cardBg, borderColor }}
              extra={
                <Button
                  size="small"
                  type="link"
                  onClick={() => {
                    const defaults = [
                      t('estimateBuilder.defaultTerms.payment'),
                      t('estimateBuilder.defaultTerms.delivery'),
                      t('estimateBuilder.defaultTerms.cancellation'),
                      t('estimateBuilder.defaultTerms.warranty'),
                      t('estimateBuilder.defaultTerms.liability'),
                    ].join('\n');
                    form.setFieldValue('terms_and_conditions', defaults);
                  }}
                >
                  {t('estimateBuilder.useDefaultTerms')}
                </Button>
              }
            >
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                {t('estimateBuilder.termsInstructions')}
              </Text>
              <Form.Item name="terms_and_conditions" style={{ marginBottom: 0 }}>
                <TextArea
                  rows={6}
                  placeholder={t('estimateBuilder.termsPlaceholder')}
                />
              </Form.Item>
            </Card>

          </Col>

          <Col xs={24} lg={8}>
            <Card title={<Space><CalendarOutlined /><span>{t('estimateBuilder.estimateDetails')}</span></Space>}
              style={{ marginBottom: 16, background: cardBg, borderColor }}>
              <Form.Item label={t('estimateBuilder.estimateDate')}>
                <Input readOnly value={dayjs().format('DD MMM YYYY')}
                  style={{ background: mutedBg, color: '#6b7280', cursor: 'default' }} />
              </Form.Item>
              <Form.Item name="expiry_date" label={t('estimateBuilder.validUntil')} rules={[{ required: true, message: t('estimateBuilder.expiryDateRequired') }]}>
                <DatePicker style={{ width: '100%' }} format="DD MMM YYYY"
                  disabledDate={(d) => d && d.isBefore(dayjs(), 'day')} placeholder={t('estimateBuilder.selectExpiryDate')} />
              </Form.Item>
              <Form.Item name="priority" label={t('estimateBuilder.priorityLabel')} style={{ marginBottom: 0 }}>
                <Select placeholder={t('estimateBuilder.selectPriority')} allowClear>
                  {PRIORITIES.map((p) => (
                    <Select.Option key={p.value} value={p.value}>
                      <Badge color={p.dot} text={t(`estimateBuilder.priorities.${p.value}`)} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            <Card title={<Space><DollarOutlined /><span>{t('estimateBuilder.financialSummary')}</span></Space>}
              style={{ marginBottom: 16, background: cardBg, borderColor }}>
              <div style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${borderColor}` }}>
                  <Text type="secondary">{t('estimateBuilder.itemsCount')}</Text>
                  <Text>{lineItems.length}</Text>
                </div>
                {[
                  { label: t('estimateBuilder.subtotal'), value: `$${subtotal.toFixed(2)}` },
                  { label: t('estimateBuilder.discount'), value: totalDiscount > 0 ? `-$${totalDiscount.toFixed(2)}` : '—', color: totalDiscount > 0 ? '#ef4444' : undefined },
                  { label: t('estimateBuilder.tax'), value: `$${totalTax.toFixed(2)}` },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <Text type="secondary">{label}</Text>
                    <Text style={{ color }}>{value}</Text>
                  </div>
                ))}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <Text strong style={{ fontSize: 14 }}>{t('estimateBuilder.total')}</Text>
                  <Text strong style={{ fontSize: 22, color: '#2563eb' }}>${grandTotal.toFixed(2)}</Text>
                </div>
              </div>
            </Card>

          </Col>
        </Row>
      </Form>

      {/* ── LINE ITEM MODAL ── */}
      <Modal
        title={editingIndex !== null ? t('estimateBuilder.editLineItem') : t('estimateBuilder.addLineItem')}
        open={modalVisible}
        onOk={saveLineItem}
        onCancel={closeModal}
        okText={editingIndex !== null ? t('estimateBuilder.updateItem') : t('estimateBuilder.addItem')}
        width={680}
        destroyOnClose
      >
        {/* Source selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>{t('estimateBuilder.itemSource')}</div>
          <Radio.Group
            value={itemSource}
            buttonStyle="solid"
            style={{ width: '100%' }}
            onChange={(e) => {
              setItemSource(e.target.value as ItemSource);
              lineItemForm.resetFields();
              lineItemForm.setFieldsValue({ quantity: 1, unit: 'each', unit_price: 0, tax_rate: 0, discount: 0 });
            }}
          >
            <Radio.Button value="service" style={{ width: '33.33%', textAlign: 'center' }}>
              <Space size={4}><AppstoreOutlined />{t('estimateBuilder.servicesCatalog')}</Space>
            </Radio.Button>
            <Radio.Button value="part" style={{ width: '33.33%', textAlign: 'center' }}>
              <Space size={4}><ToolOutlined />{t('estimateBuilder.partsCatalog')}</Space>
            </Radio.Button>
            <Radio.Button value="manual" style={{ width: '33.34%', textAlign: 'center' }}>
              <Space size={4}><FormOutlined />{t('estimateBuilder.manualEntry')}</Space>
            </Radio.Button>
          </Radio.Group>
        </div>

        <Form form={lineItemForm} layout="vertical">

          {/* Services Catalog */}
          {itemSource === 'service' && (
            <Form.Item label={t('estimateBuilder.chooseServicesCatalog')} style={{ marginBottom: 16 }}>
              <Select
                showSearch
                allowClear
                placeholder={t('estimateBuilder.searchServicesPlaceholder')}
                optionFilterProp="label"
                options={activeSvcOptions}
                notFoundContent={<div style={{ padding: '8px 0', color: '#9ca3af', textAlign: 'center' }}>{t('estimateBuilder.noActiveServices')}</div>}
                onChange={(serviceId: string) => {
                  if (!serviceId) return;
                  const svc = (servicesCatalog as ServiceCatalogItem[]).find((s) => s.id === serviceId);
                  if (!svc) return;
                  lineItemForm.setFieldsValue({
                    name:        svc.name,
                    description: svc.description || '',
                    unit_price:  Number(svc.default_price) || 0,
                    tax_rate:    Number(svc.tax_rate) || 0,
                    unit:        svc.duration_minutes ? 'hrs' : 'each',
                    quantity:    1,
                    discount:    0,
                  });
                }}
              />
            </Form.Item>
          )}

          {/* Parts Catalog */}
          {itemSource === 'part' && (
            <Form.Item label={t('estimateBuilder.choosePartsCatalog')} style={{ marginBottom: 16 }}>
              <Select
                showSearch
                allowClear
                placeholder={t('estimateBuilder.searchPartsPlaceholder')}
                optionFilterProp="label"
                options={activePartOptions}
                notFoundContent={<div style={{ padding: '8px 0', color: '#9ca3af', textAlign: 'center' }}>{t('estimateBuilder.noActiveParts')}</div>}
                onChange={(partId: string) => {
                  if (!partId) return;
                  const part = (partsCatalog as PartsCatalogItem[]).find((p) => p.id === partId);
                  if (!part) return;
                  lineItemForm.setFieldsValue({
                    name:        part.name,
                    description: part.description || (part.sku ? `SKU: ${part.sku}` : ''),
                    unit_price:  Number(part.unit_price) || 0,
                    tax_rate:    0,
                    unit:        'each',
                    quantity:    1,
                    discount:    0,
                  });
                }}
              />
            </Form.Item>
          )}

          {/* Manual mode — type selector */}
          {itemSource === 'manual' && (
            <Form.Item name="type" label={t('estimateBuilder.itemType')} rules={[{ required: true, message: t('estimateBuilder.pleaseSelectType') }]} style={{ marginBottom: 16 }}>
              <Select placeholder={t('estimateBuilder.selectType')}
                options={MANUAL_TYPES.map((tItem) => ({ value: tItem.value, label: t(`estimateBuilder.types.${tItem.value}`) }))}
              />
            </Form.Item>
          )}

          <Divider style={{ margin: '4px 0 16px' }} />

          {/* Common fields */}
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label={t('estimateBuilder.itemName')} rules={[{ required: true, message: t('estimateBuilder.itemNameRequired') }]}>
                <Input placeholder={t('estimateBuilder.itemNamePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label={t('estimateBuilder.unit')}>
                <Select placeholder={t('estimateBuilder.unitEachPlaceholder')} allowClear options={UNITS.map((u) => ({ value: u, label: t(`estimateBuilder.units.${u}`, { defaultValue: u }) }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={t('estimateBuilder.description')}>
            <TextArea rows={2} placeholder={t('estimateBuilder.descriptionPlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label={t('estimateBuilder.quantity')} rules={[{ required: true, message: t('estimateBuilder.requiredField') }]}>
                <InputNumber min={0.01} step={1} style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit_price" label={t('estimateBuilder.unitPrice')} rules={[{ required: true, message: t('estimateBuilder.requiredField') }]}>
                <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_rate" label={t('estimateBuilder.taxRate')}>
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discount_type" label={t('estimateBuilder.discountType')} initialValue="fixed">
                <Select
                  options={[
                    { value: 'fixed', label: t('estimateBuilder.fixedAmount') },
                    { value: 'percentage', label: t('estimateBuilder.percentage') },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev?.discount_type !== curr?.discount_type}
              >
                {({ getFieldValue }) => {
                  const dType = getFieldValue('discount_type') || 'fixed';
                  return (
                    <Form.Item name="discount" label={dType === 'percentage' ? t('estimateBuilder.discountPercent') : t('estimateBuilder.discountFixed')} style={{ marginBottom: 0 }}>
                      <InputNumber
                        min={0}
                        max={dType === 'percentage' ? 100 : undefined}
                        step={dType === 'percentage' ? 1 : 0.01}
                        prefix={dType === 'percentage' ? undefined : '$'}
                        suffix={dType === 'percentage' ? '%' : undefined}
                        style={{ width: '100%' }}
                        precision={2}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Save as Template"
        open={templateModalVisible}
        onOk={doSaveAsTemplate}
        onCancel={() => setTemplateModalVisible(false)}
        confirmLoading={isSaving}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Please enter a name for this template:</Text>
        </div>
        <Input
          placeholder="e.g., Standard Installation"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </Modal>
    </div>
  );
}