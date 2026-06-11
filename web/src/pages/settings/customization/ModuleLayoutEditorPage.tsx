import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Tabs,
  Typography,
  Checkbox,
  Input,
  InputNumber,
  Divider,
  Tooltip,
  Spin,
  Tag,
  Select,
  Dropdown,
  message,
} from 'antd';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CloseOutlined,
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  NumberOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  PercentageOutlined,
  PaperClipOutlined,
  PictureOutlined,
  FieldStringOutlined,
  ClockCircleOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import {
  useCustomFieldsByModule,
  useCreateCustomField,
  useDeleteCustomField,
  useBatchUpdateCustomFields,
} from '@/hooks/use-custom-fields';
import { useTenantModules } from '@/hooks/use-tenant-modules';
import { getSystemFieldsForModule, MODULE_SYSTEM_FIELDS } from '@/config/module-system-fields';
import { useUiStore } from '@/store/ui.store';
import type { CustomField } from '@/types/models.types';

const { Text, Title } = Typography;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LayoutField {
  id: string;           // unique id in this UI (custom field uuid or 'sys::field_name')
  field_name: string;
  field_label: string;
  field_type: string;
  is_system: boolean;
  is_required: boolean;
  is_visible: boolean;
  section_name: string;
  section_order: number;
  sort_order: number;
  char_limit?: number | null;
  is_pii?: boolean;
  is_encrypted?: boolean;
  can_rename?: boolean;
  can_hide?: boolean;
  can_set_required?: boolean;
  can_set_char_limit?: boolean;
  // Only set for real DB records
  db_id?: string;
}

interface LayoutSection {
  section_name: string;
  section_order: number;
  fields: LayoutField[];
}

// ─── Palette Field Types ────────────────────────────────────────────────────────

const PALETTE_FIELD_TYPES = [
  { field_type: 'text', label: 'Single Line', icon: <FieldStringOutlined /> },
  { field_type: 'textarea', label: 'Multi-line', icon: <BarsOutlined /> },
  { field_type: 'number', label: 'Number', icon: <NumberOutlined /> },
  { field_type: 'currency', label: 'Currency', icon: <DollarOutlined /> },
  { field_type: 'percentage', label: 'Percentage', icon: <PercentageOutlined /> },
  { field_type: 'phone', label: 'Phone', icon: <PhoneOutlined /> },
  { field_type: 'email', label: 'Email', icon: <MailOutlined /> },
  { field_type: 'url', label: 'URL', icon: <LinkOutlined /> },
  { field_type: 'date', label: 'Date', icon: <CalendarOutlined /> },
  { field_type: 'datetime', label: 'Date Time', icon: <ClockCircleOutlined /> },
  { field_type: 'checkbox', label: 'Checkbox', icon: <CheckSquareOutlined /> },
  { field_type: 'dropdown', label: 'Picklist', icon: <UnorderedListOutlined /> },
  { field_type: 'multi_select', label: 'Multi-Select', icon: <UnorderedListOutlined /> },
  { field_type: 'file', label: 'File', icon: <PaperClipOutlined /> },
  { field_type: 'image', label: 'Image', icon: <PictureOutlined /> },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Single Line',
  textarea: 'Multi-line',
  number: 'Number',
  currency: 'Currency',
  percentage: 'Percentage',
  phone: 'Phone',
  email: 'Email',
  url: 'URL',
  date: 'Date',
  datetime: 'Date Time',
  checkbox: 'Checkbox',
  dropdown: 'Picklist',
  multi_select: 'Multi-Select',
  file: 'File',
  image: 'Image',
  system: 'System',
  lookup: 'Lookup',
};

// ─── Palette Draggable Item ─────────────────────────────────────────────────────

function PaletteItem({ fieldType, label, icon, isDark }: { fieldType: string; label: string; icon: React.ReactNode; isDark: boolean }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('palette_field_type', fieldType);
        e.dataTransfer.setData('palette_label', label);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 8px',
        borderRadius: 8,
        border: `1.5px solid ${isDark ? '#303030' : '#e8e8e8'}`,
        background: isDark ? '#1a1a1a' : '#fafafa',
        cursor: 'grab',
        fontSize: 11,
        color: isDark ? '#b0b0b0' : '#595959',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#1890ff';
        (e.currentTarget as HTMLDivElement).style.color = '#1890ff';
        (e.currentTarget as HTMLDivElement).style.background = isDark ? '#0d2137' : '#e8f4fd';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = isDark ? '#303030' : '#e8e8e8';
        (e.currentTarget as HTMLDivElement).style.color = isDark ? '#b0b0b0' : '#595959';
        (e.currentTarget as HTMLDivElement).style.background = isDark ? '#1a1a1a' : '#fafafa';
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ textAlign: 'center', lineHeight: '1.3' }}>{label}</span>
    </div>
  );
}

// ─── Sortable Field Row ─────────────────────────────────────────────────────────

function FieldRow({
  field,
  isSelected,
  onSelect,
  onDelete,
  isDark,
}: {
  field: LayoutField;
  isSelected: boolean;
  onSelect: (f: LayoutField) => void;
  onDelete: (id: string) => void;
  isDark: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: `transform ${transition ?? '0.2s'}, border-color 0.2s, background 0.2s`,
    opacity: isDragging ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    border: `1.5px solid ${isSelected ? '#1890ff' : isDark ? '#303030' : '#e8e8e8'}`,
    background: isSelected
      ? isDark ? '#0d2137' : '#e8f4fd'
      : isDark ? '#1f1f1f' : '#fff',
    cursor: 'pointer',
    marginBottom: 4,
  };

  return (
    <div ref={setNodeRef} style={style} onClick={() => onSelect(field)}>
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: isDark ? '#555' : '#bfbfbf', fontSize: 14, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <HolderOutlined />
      </span>

      {/* Field info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
          {field.field_label || field.field_name}
        </Text>
        {field.is_required && (
          <Text style={{ color: '#ff4d4f', marginLeft: 4 }}>*</Text>
        )}
      </div>

      {/* Field type */}
      <Text style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }}>
        {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
      </Text>

      {/* Badges */}
      {field.is_system && (
        <Tag style={{ fontSize: 10, lineHeight: '16px', height: 16, margin: 0 }}>System</Tag>
      )}
      {field.is_pii && (
        <Tag color="orange" style={{ fontSize: 10, lineHeight: '16px', height: 16, margin: 0 }}>PII</Tag>
      )}

      {/* Delete (custom fields only) */}
      {!field.is_system && (
        <Tooltip title="Remove field">
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            danger
            style={{ flexShrink: 0, opacity: 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(field.id);
            }}
          />
        </Tooltip>
      )}
    </div>
  );
}

// ─── Field Properties Panel ─────────────────────────────────────────────────────

function FieldPropertiesPanel({
  field,
  onClose,
  onUpdate,
  isDark,
}: {
  field: LayoutField;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<LayoutField>) => void;
  isDark: boolean;
}) {
  const panelBg = isDark ? '#141414' : '#fff';
  const borderColor = isDark ? '#303030' : '#f0f0f0';

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        background: panelBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text strong style={{ fontSize: 13, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
          Field Properties
        </Text>
        <Button type="text" icon={<CloseOutlined />} size="small" onClick={onClose} />
      </div>

      {/* Body */}
      <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Field Label */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Field label
          </Text>
          <Input
            value={field.field_label || ''}
            onChange={(e) => onUpdate(field.id, { field_label: e.target.value })}
            size="small"
            style={{ borderRadius: 6 }}
            disabled={field.can_rename === false}
            placeholder={field.field_name}
          />
        </div>

        {/* API Name */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            API Name
          </Text>
          <Input
            value={field.field_name}
            disabled
            size="small"
            style={{ borderRadius: 6, background: isDark ? '#1f1f1f' : '#f5f5f5', color: isDark ? '#999' : '#8c8c8c' }}
          />
        </div>

        <Divider style={{ margin: '4px 0', borderColor: isDark ? '#303030' : '#f0f0f0' }} />

        {/* Validation */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Validation
          </Text>
          <Checkbox
            checked={field.is_required}
            onChange={(e) => onUpdate(field.id, { is_required: e.target.checked })}
            disabled={field.can_set_required === false}
          >
            <Text style={{ fontSize: 12 }}>Mandatory</Text>
          </Checkbox>
        </div>

        {/* Character Limit — text/textarea only */}
        {(field.field_type === 'text' || field.field_type === 'textarea') && field.can_set_char_limit !== false && (
          <div>
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Character Limit
            </Text>
            <InputNumber
              value={field.char_limit ?? undefined}
              onChange={(v) => onUpdate(field.id, { char_limit: v ?? null })}
              min={1}
              max={65535}
              size="small"
              style={{ width: '100%', borderRadius: 6 }}
              placeholder="255"
            />
          </div>
        )}

        <Divider style={{ margin: '4px 0', borderColor: isDark ? '#303030' : '#f0f0f0' }} />

        {/* Data Privacy */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Privacy
          </Text>
          <Checkbox
            checked={field.is_pii}
            onChange={(e) => onUpdate(field.id, { is_pii: e.target.checked })}
          >
            <Text style={{ fontSize: 12 }}>Contains personal data (PII)</Text>
          </Checkbox>
        </div>

        {/* Data Security */}
        <div>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Security
          </Text>
          <Checkbox
            checked={field.is_encrypted}
            onChange={(e) => onUpdate(field.id, { is_encrypted: e.target.checked })}
            disabled={field.is_system}
          >
            <Text style={{ fontSize: 12 }}>Encrypt Data</Text>
          </Checkbox>
        </div>

        <Divider style={{ margin: '4px 0', borderColor: isDark ? '#303030' : '#f0f0f0' }} />

        {/* Delete (custom fields only) */}
        {!field.is_system && (
          <div style={{ marginTop: 'auto' }}>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ width: '100%' }}
            >
              Delete Field
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Component ──────────────────────────────────────────────────────────

function LayoutSection({
  section,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onRenameSection,
  onDropOnSection,
  isDark,
}: {
  section: LayoutSection;
  selectedFieldId: string | null;
  onSelectField: (f: LayoutField) => void;
  onDeleteField: (id: string) => void;
  onRenameSection: (oldName: string, newName: string) => void;
  onDropOnSection: (sectionName: string, fieldType: string, fieldLabel: string) => void;
  isDark: boolean;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(section.section_name);
  const [isHoveringDrop, setIsHoveringDrop] = useState(false);

  const handleNameSubmit = () => {
    setEditingName(false);
    if (draftName.trim() && draftName !== section.section_name) {
      onRenameSection(section.section_name, draftName.trim());
    }
  };

  const borderColor = isDark ? '#303030' : '#e8e8e8';
  const sectionBg = isDark ? '#141414' : '#f9f9f9';

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1.5px solid ${isHoveringDrop ? '#1890ff' : borderColor}`,
        background: sectionBg,
        marginBottom: 16,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsHoveringDrop(true); }}
      onDragLeave={() => setIsHoveringDrop(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsHoveringDrop(false);
        const fieldType = e.dataTransfer.getData('palette_field_type');
        const fieldLabel = e.dataTransfer.getData('palette_label');
        if (fieldType) {
          onDropOnSection(section.section_name, fieldType, fieldLabel);
        }
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isDark ? '#1f1f1f' : '#f0f0f0',
        }}
      >
        {editingName ? (
          <Input
            autoFocus
            size="small"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={handleNameSubmit}
            onPressEnter={handleNameSubmit}
            style={{ flex: 1, fontWeight: 600, fontSize: 12, maxWidth: 200 }}
          />
        ) : (
          <Text
            strong
            style={{ fontSize: 12, flex: 1, color: isDark ? '#e5e7eb' : '#1a1a2e', cursor: 'text' }}
            onDoubleClick={() => { setEditingName(true); setDraftName(section.section_name); }}
          >
            {section.section_name}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{section.fields.length} fields</Text>
        <Tooltip title="Double-click section name to rename">
          <Text style={{ fontSize: 10, color: '#bfbfbf', cursor: 'default' }}>rename</Text>
        </Tooltip>
      </div>

      {/* Fields */}
      <div style={{ padding: '8px' }}>
        <SortableContext items={section.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
          {section.fields.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: isDark ? '#555' : '#bfbfbf',
                fontSize: 12,
                border: `1.5px dashed ${isDark ? '#333' : '#d9d9d9'}`,
                borderRadius: 8,
              }}
            >
              Drag fields here
            </div>
          ) : (
            section.fields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                isSelected={selectedFieldId === field.id}
                onSelect={onSelectField}
                onDelete={onDeleteField}
                isDark={isDark}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// Extended CustomField type with new layout columns returned by API
type ExtCustomField = CustomField & {
  field_label?: string | null;
  section_name?: string | null;
  section_order?: number;
  is_system?: boolean;
  is_visible?: boolean;
  char_limit?: number | null;
  is_pii?: boolean;
  is_encrypted?: boolean;
};

function buildSectionsFromDb(
  dbFieldsRaw: CustomField[],
  systemSections: ReturnType<typeof getSystemFieldsForModule>,
  _moduleName: string,
): LayoutSection[] {
  const dbFields = dbFieldsRaw as ExtCustomField[];
  // Start with system fields as the base
  const sectionsMap: Map<string, LayoutSection> = new Map();

  // Add system sections
  for (const sysSection of systemSections) {
    const section: LayoutSection = {
      section_name: sysSection.section_name,
      section_order: sysSection.section_order,
      fields: sysSection.fields.map((sf) => ({
        id: `sys::${sf.field_name}`,
        field_name: sf.field_name,
        field_label: sf.field_label,
        field_type: sf.field_type,
        is_system: true,
        is_required: sf.is_required ?? false,
        is_visible: true,
        section_name: sf.section_name,
        section_order: sf.section_order,
        sort_order: sf.sort_order,
        can_rename: sf.can_rename ?? true,
        can_hide: sf.can_hide ?? false,
        can_set_required: sf.can_set_required ?? false,
        can_set_char_limit: sf.can_set_char_limit ?? false,
      })),
    };
    sectionsMap.set(sysSection.section_name, section);
  }

  // Override system fields with any DB overrides, add custom fields
  for (const dbField of dbFields) {
    const sectionKey = dbField.section_name || 'General';
    if (!sectionsMap.has(sectionKey)) {
      sectionsMap.set(sectionKey, {
        section_name: sectionKey,
        section_order: dbField.section_order ?? 99,
        fields: [],
      });
    }
    const section = sectionsMap.get(sectionKey)!;

    // If this is a system field override
    const sysId = `sys::${dbField.field_name}`;
    const sysIdx = section.fields.findIndex((f) => f.id === sysId);
    if (dbField.is_system && sysIdx >= 0) {
      // Merge DB label override into the system field
      section.fields[sysIdx] = {
        ...section.fields[sysIdx],
        field_label: dbField.field_label || section.fields[sysIdx].field_label,
        is_required: dbField.is_required,
        is_pii: dbField.is_pii,
        is_encrypted: dbField.is_encrypted,
        char_limit: dbField.char_limit,
        sort_order: dbField.sort_order,
        db_id: dbField.id,
      };
    } else if (!dbField.is_system) {
      // Custom field
      section.fields.push({
        id: dbField.id,
        field_name: dbField.field_name,
        field_label: dbField.field_label || dbField.field_name,
        field_type: dbField.field_type,
        is_system: false,
        is_required: dbField.is_required,
        is_visible: dbField.is_visible !== false,
        section_name: sectionKey,
        section_order: dbField.section_order ?? 99,
        sort_order: dbField.sort_order,
        char_limit: dbField.char_limit,
        is_pii: dbField.is_pii,
        is_encrypted: dbField.is_encrypted,
        can_rename: true,
        can_hide: true,
        can_set_required: true,
        can_set_char_limit: true,
        db_id: dbField.id,
      });
    }
  }

  // Sort sections by section_order, fields by sort_order
  const sorted = Array.from(sectionsMap.values())
    .sort((a, b) => a.section_order - b.section_order);
  for (const s of sorted) {
    s.fields.sort((a, b) => a.sort_order - b.sort_order);
  }

  return sorted;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function ModuleLayoutEditorPage() {
  const { moduleName } = useParams<{ moduleName: string }>();
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const setSettingsSidebarHidden = useUiStore((s) => s.setSettingsSidebarHidden);
  const isDark = theme === 'dark';

  const decodedModuleName = decodeURIComponent(moduleName ?? '');

  // Hide the settings sidebar for full-width layout editing; restore on leave
  useEffect(() => {
    setSettingsSidebarHidden(true);
    return () => setSettingsSidebarHidden(false);
  }, [setSettingsSidebarHidden]);

  const { data: dbFields, isLoading } = useCustomFieldsByModule(decodedModuleName);
  const createField = useCreateCustomField();
  const deleteField = useDeleteCustomField();
  const batchUpdate = useBatchUpdateCustomFields();

  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'unused'>('new');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const systemSections = getSystemFieldsForModule(decodedModuleName);

  // All modules for the switcher dropdown
  const { data: tenantModules } = useTenantModules();
  const allModules: { module_name: string; is_active: boolean }[] = (
    tenantModules ??
    // Fallback: use the static config keys so dropdown still works before data loads
    Object.keys(MODULE_SYSTEM_FIELDS).map((name) => ({ module_name: name, is_active: true }))
  );

  // Build layout from server data + system fields on load
  useEffect(() => {
    if (!isLoading) {
      setSections(buildSectionsFromDb(dbFields ?? [], systemSections, decodedModuleName));
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbFields, isLoading]);

  const selectedField = sections.flatMap((s) => s.fields).find((f) => f.id === selectedFieldId) ?? null;

  const unusedFields = (dbFields ?? []).filter(
    (f) => (f as unknown as { is_visible?: boolean }).is_visible === false
  );

  // ─ Sensors ─
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // ─ DnD handlers ─
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) => {
      const newSections = prev.map((section) => {
        const activeIdx = section.fields.findIndex((f) => f.id === active.id);
        const overIdx = section.fields.findIndex((f) => f.id === over.id);
        if (activeIdx === -1 || overIdx === -1) return section;
        return {
          ...section,
          fields: arrayMove(section.fields, activeIdx, overIdx).map((f, i) => ({
            ...f,
            sort_order: i,
          })),
        };
      });
      return newSections;
    });
    setIsDirty(true);
  };

  // ─ Drop from palette ─
  const handlePaletteDrop = useCallback(
    async (sectionName: string, fieldType: string, fieldLabel: string) => {
      const newFieldName = `custom_${fieldType}_${Date.now()}`;
      try {
        await createField.mutateAsync({
          module: decodedModuleName,
          field_name: newFieldName,
          field_label: fieldLabel,
          field_type: fieldType,
          section_name: sectionName,
          section_order: sections.find((s) => s.section_name === sectionName)?.section_order ?? 0,
          sort_order: (sections.find((s) => s.section_name === sectionName)?.fields.length ?? 0),
          is_visible: true,
        });
      } catch {
        // handled by mutation
      }
    },
    [createField, decodedModuleName, sections],
  );

  // ─ Update field property ─
  const handleFieldUpdate = useCallback((id: string, patch: Partial<LayoutField>) => {
    setSections((prev) =>
      prev.map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.id === id ? { ...f, ...patch } : f
        ),
      }))
    );
    setIsDirty(true);
  }, []);

  // ─ Delete field ─
  const handleDeleteField = useCallback(
    async (id: string) => {
      const field = sections.flatMap((s) => s.fields).find((f) => f.id === id);
      if (!field || field.is_system) return;
      if (field.db_id) {
        await deleteField.mutateAsync(field.db_id);
      }
      if (selectedFieldId === id) setSelectedFieldId(null);
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          fields: section.fields.filter((f) => f.id !== id),
        }))
      );
    },
    [sections, selectedFieldId, deleteField],
  );

  // ─ Rename section ─
  const handleRenameSection = useCallback((oldName: string, newName: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.section_name === oldName
          ? { ...s, section_name: newName, fields: s.fields.map((f) => ({ ...f, section_name: newName })) }
          : s
      )
    );
    setIsDirty(true);
  }, []);

  // ─ Add section ─
  const handleAddSection = () => {
    const newName = `Section ${sections.length + 1}`;
    setSections((prev) => [
      ...prev,
      { section_name: newName, section_order: prev.length, fields: [] },
    ]);
    setIsDirty(true);
  };

  // ─ Save layout ─
  const handleSave = async () => {
    const updates: Parameters<typeof batchUpdate.mutate>[0] = [];

    for (const section of sections) {
      for (const field of section.fields) {
        if (field.db_id) {
          updates.push({
            id: field.db_id,
            field_label: field.field_label || undefined,
            section_name: field.section_name,
            section_order: field.section_order,
            sort_order: field.sort_order,
            is_visible: field.is_visible,
            is_required: field.is_required,
            char_limit: field.char_limit ?? undefined,
            is_pii: field.is_pii,
            is_encrypted: field.is_encrypted,
          });
        }
      }
    }

    if (updates.length > 0) {
      await batchUpdate.mutateAsync(updates);
    } else {
      message.info('No persisted fields to update. Add custom fields to save layout changes.');
    }
    setIsDirty(false);
  };

  // ─── Colors & styles ─────────────────────────────────────────────────────────
  const bg = isDark ? '#0f0f0f' : '#f4f6f9';
  const panelBg = isDark ? '#141414' : '#fff';
  const borderColor = isDark ? '#303030' : '#e8e8e8';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 0 16px 0',
          borderBottom: `1px solid ${borderColor}`,
          marginBottom: 16,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/settings/customization/modules')}
          style={{ color: isDark ? '#a3a3a3' : '#595959' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {/* Module switcher — Zoho-style dropdown */}
          <Dropdown
            menu={{
              items: allModules.map((m) => ({
                key: m.module_name,
                label: m.module_name,
                onClick: () => {
                  if (m.module_name !== decodedModuleName) {
                    navigate(`/settings/customization/modules/${encodeURIComponent(m.module_name)}/layout`);
                  }
                },
                style:
                  m.module_name === decodedModuleName
                    ? { fontWeight: 600, color: '#1890ff', background: isDark ? '#0d2137' : '#e8f4fd' }
                    : {},
              })),
              style: { maxHeight: 320, overflowY: 'auto' },
            }}
            trigger={['click']}
            placement="bottomLeft"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: '4px 10px 4px 4px',
                borderRadius: 8,
                transition: 'background 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark ? '#2a2a2a' : '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Title level={5} style={{ margin: 0, color: isDark ? '#e5e7eb' : '#1a1a2e' }}>
                {decodedModuleName}
              </Title>
              <DownOutlined style={{ fontSize: 10, color: isDark ? '#8c8c8c' : '#8c8c8c', marginTop: 2 }} />
            </div>
          </Dropdown>

          {/* Layout label */}
          <Tag style={{ fontSize: 11 }}>Layout</Tag>

          {/* Standard layout picker (single layout for now) */}
          <Select
            value="Standard"
            size="small"
            style={{ width: 110 }}
            options={[{ value: 'Standard', label: 'Standard' }]}
            disabled
          />
        </div>

        <Button onClick={() => navigate('/settings/customization/modules')}>
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={batchUpdate.isPending}
          onClick={handleSave}
          disabled={!isDirty && !batchUpdate.isPending}
          style={{ background: isDirty ? '#1890ff' : undefined }}
        >
          Save
        </Button>
      </div>

      {/* Editor body */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Spin size="large" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

            {/* Left: Field Palette */}
            <div
              style={{
                width: 240,
                flexShrink: 0,
                background: panelBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Tabs
                activeKey={activeTab}
                onChange={(k) => setActiveTab(k as 'new' | 'unused')}
                size="small"
                style={{ flex: 1 }}
                tabBarStyle={{ padding: '0 12px', marginBottom: 0 }}
                items={[
                  {
                    key: 'new',
                    label: 'New Fields',
                    children: (
                      <div
                        style={{
                          padding: '8px 10px',
                          overflowY: 'auto',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 6,
                        }}
                      >
                        {/* Normal Fields */}
                        <div style={{ gridColumn: '1 / -1', fontSize: 10, fontWeight: 700, color: '#8c8c8c', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '4px 0' }}>
                          Normal Fields
                        </div>
                        {PALETTE_FIELD_TYPES.slice(0, 10).map((pt) => (
                          <PaletteItem key={pt.field_type} fieldType={pt.field_type} label={pt.label} icon={pt.icon} isDark={isDark} />
                        ))}
                        {/* Advanced Fields */}
                        <div style={{ gridColumn: '1 / -1', fontSize: 10, fontWeight: 700, color: '#8c8c8c', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '8px 0 4px' }}>
                          Advance Fields
                        </div>
                        {PALETTE_FIELD_TYPES.slice(10).map((pt) => (
                          <PaletteItem key={pt.field_type} fieldType={pt.field_type} label={pt.label} icon={pt.icon} isDark={isDark} />
                        ))}
                        {/* New Section button */}
                        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                          <Button
                            block
                            icon={<PlusOutlined />}
                            size="small"
                            onClick={handleAddSection}
                            style={{ fontSize: 11 }}
                          >
                            New Section
                          </Button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'unused',
                    label: 'Unused',
                    children: (
                      <div style={{ padding: '8px 10px', overflowY: 'auto' }}>
                        {unusedFields.length === 0 ? (
                          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                            No unused fields
                          </Text>
                        ) : (
                          unusedFields.map((f) => (
                            <div
                              key={f.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('palette_field_type', f.field_type);
                                e.dataTransfer.setData('palette_label', f.field_name);
                              }}
                              style={{
                                padding: '6px 8px',
                                marginBottom: 4,
                                borderRadius: 6,
                                border: `1px solid ${isDark ? '#303030' : '#e8e8e8'}`,
                                fontSize: 11,
                                cursor: 'grab',
                                color: isDark ? '#b0b0b0' : '#595959',
                              }}
                            >
                              {(f as unknown as { field_label?: string }).field_label || f.field_name}
                            </div>
                          ))
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>

            {/* Center: Canvas */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 4px',
              }}
            >
              {sections.map((section) => (
                <LayoutSection
                  key={section.section_name}
                  section={section}
                  selectedFieldId={selectedFieldId}
                  onSelectField={(f) => setSelectedFieldId(f.id)}
                  onDeleteField={handleDeleteField}
                  onRenameSection={handleRenameSection}
                  onDropOnSection={handlePaletteDrop}
                  isDark={isDark}
                />
              ))}

              {sections.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: isDark ? '#555' : '#bfbfbf',
                    border: `2px dashed ${isDark ? '#333' : '#d9d9d9'}`,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: isDark ? '#555' : '#bfbfbf' }}>
                    No sections yet. Click "New Section" in the left panel to get started.
                  </Text>
                </div>
              )}
            </div>

            {/* Right: Field Properties Panel */}
            {selectedField && (
              <FieldPropertiesPanel
                field={selectedField}
                onClose={() => setSelectedFieldId(null)}
                onUpdate={handleFieldUpdate}
                isDark={isDark}
              />
            )}
          </div>

          <DragOverlay>
            {activeDragId ? (
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  background: '#1890ff',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(24,144,255,0.4)',
                }}
              >
                {sections.flatMap((s) => s.fields).find((f) => f.id === activeDragId)?.field_label || 'Field'}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
