import { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  invoicesApi,
  invoiceLineItemsApi,
  contactsApi,
  workOrdersApi,
  servicesCatalogApi,
  partsCatalogApi,
} from '@/api/endpoints';
import { formatCurrency } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Contact, WorkOrder, ServiceCatalogItem, PartsCatalogItem } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = 'service' | 'part' | 'travel' | 'other';

interface DraftItem {
  localId: string;
  type: ItemType;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
}

function makeDraft(type: ItemType, name = '', price = 0): DraftItem {
  return {
    localId: Math.random().toString(36).slice(2),
    type,
    name,
    description: '',
    quantity: 1,
    unit_price: price,
    tax_rate: 0,
    discount: 0,
  };
}

// ─── Maths ────────────────────────────────────────────────────────────────────

function lineSubtotal(item: DraftItem): number {
  return item.quantity * item.unit_price;
}
function lineTax(item: DraftItem): number {
  return lineSubtotal(item) * (item.tax_rate / 100);
}
function lineDiscount(item: DraftItem): number {
  return item.discount;
}
function lineTotal(item: DraftItem): number {
  return lineSubtotal(item) - lineDiscount(item) + lineTax(item);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<ItemType, keyof typeof Ionicons.glyphMap> = {
  service: 'briefcase-outline',
  part: 'cube-outline',
  travel: 'car-outline',
  other: 'ellipsis-horizontal-outline',
};

const TYPE_COLORS: Record<ItemType, string> = {
  service: '#6366f1',
  part: '#0ea5e9',
  travel: '#f59e0b',
  other: '#6b7280',
};

const TYPE_LABELS: Record<ItemType, string> = {
  service: 'Service',
  part: 'Part',
  travel: 'Travel',
  other: 'Other',
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'] as const;
type Currency = (typeof CURRENCIES)[number];

// ─── Catalog picker item shape ────────────────────────────────────────────────

interface CatalogEntry {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
}

function svcToCatalog(s: ServiceCatalogItem): CatalogEntry {
  return { id: s.id, name: s.name, description: s.description, price: s.default_price };
}
function partToCatalog(p: PartsCatalogItem): CatalogEntry {
  return { id: p.id, name: p.name, description: p.description, price: p.unit_price };
}

// ─── Shared field components ──────────────────────────────────────────────────

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}{required && <Text style={styles.labelRequired}> *</Text>}
    </Text>
  );
}

function TextField({
  label, value, onChangeText, placeholder, required, multiline, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean; error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} required={required} />
      <TextInput
        style={[styles.input, multiline && styles.inputMulti, !!error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function NumField({
  label, value, onChangeText, prefix, placeholder, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  prefix?: string; placeholder?: string; error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} />
      <View style={[styles.numRow, !!error && styles.inputError]}>
        {prefix ? <Text style={styles.numPrefix}>{prefix}</Text> : null}
        <TextInput
          style={styles.numInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? '0'}
          placeholderTextColor={colors.textLight}
          keyboardType="decimal-pad"
          selectTextOnFocus
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function SelectField({
  label, value, placeholder, onPress, onClear,
}: {
  label: string; value: string; placeholder: string;
  onPress: () => void; onClear: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel text={label} />
      <TouchableOpacity style={styles.selectBtn} onPress={onPress} activeOpacity={0.7}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={18} color={colors.textLight} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Calendar Picker Modal ────────────────────────────────────────────────────

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function CalendarPickerModal({
  visible, value, onConfirm, onClose,
}: {
  visible: boolean;
  value: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const today = dayjs().startOf('day');
  const initial = value ? dayjs(value) : today;
  const [viewDate, setViewDate] = useState<Dayjs>(initial.startOf('month'));
  const [selected, setSelected] = useState<Dayjs | null>(value ? dayjs(value) : null);

  const prevMonth = () => setViewDate((d) => d.subtract(1, 'month'));
  const nextMonth = () => setViewDate((d) => d.add(1, 'month'));

  const handleDayPress = (day: Dayjs) => {
    setSelected(day);
    onConfirm(day.format('YYYY-MM-DD'));
    onClose();
  };

  const firstDay = viewDate.day();
  const daysInMonth = viewDate.daysInMonth();
  const cells: (Dayjs | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => viewDate.date(i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={calStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[calStyles.wrapper, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={calStyles.handle} />
        <View style={calStyles.nav}>
          <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={calStyles.navTitle}>{viewDate.format('MMMM YYYY')}</Text>
          <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={calStyles.weekRow}>
          {DAY_NAMES.map((d) => (
            <Text key={d} style={calStyles.weekLabel}>{d}</Text>
          ))}
        </View>
        <View style={calStyles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`e-${idx}`} style={calStyles.cell} />;
            const isSelected = selected?.isSame(day, 'day') ?? false;
            const isToday = day.isSame(today, 'day');
            return (
              <TouchableOpacity
                key={day.format('YYYY-MM-DD')}
                style={[calStyles.cell, isSelected && calStyles.cellSelected, isToday && !isSelected && calStyles.cellToday]}
                onPress={() => handleDayPress(day)}
              >
                <Text style={[
                  calStyles.dayText,
                  isSelected && calStyles.dayTextSelected,
                  isToday && !isSelected && calStyles.dayTextToday,
                ]}>
                  {day.date()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selected && (
          <TouchableOpacity style={calStyles.clearBtn} onPress={() => { onConfirm(''); onClose(); }}>
            <Text style={calStyles.clearBtnText}>Clear date</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const calStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  nav: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  navBtn: { padding: spacing.sm },
  navTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekLabel: { flex: 1, textAlign: 'center', ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellSelected: { backgroundColor: ACCENT, borderRadius: 999 },
  cellToday: { borderWidth: 1.5, borderColor: ACCENT, borderRadius: 999 },
  dayText: { ...typography.body, color: colors.text },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextToday: { color: ACCENT, fontWeight: '700' },
  dayTextDisabled: { color: colors.textLight },
  clearBtn: { alignSelf: 'center', paddingVertical: spacing.md },
  clearBtnText: { ...typography.body, color: colors.error },
});

// ─── Contact Picker Modal ─────────────────────────────────────────────────────

function ContactPickerModal({
  visible, contacts, loading, selected, onSelect, onClose,
}: {
  visible: boolean; contacts: Contact[]; loading: boolean;
  selected: Contact | null; onSelect: (c: Contact) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? contacts.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
      );
    })
    : contacts;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, styles.sheetTall, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Select Contact</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or email…"
            placeholderTextColor={colors.textLight}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={ACCENT} /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
              >
                <View style={styles.sheetOptionBody}>
                  <Text style={[styles.sheetOptionText, selected?.id === item.id && { color: ACCENT, fontWeight: '600' }]}>
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.email ? <Text style={styles.sheetOptionSub}>{item.email}</Text> : null}
                </View>
                {selected?.id === item.id && <Ionicons name="checkmark" size={18} color={ACCENT} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.sheetEmpty}>No contacts found</Text>}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Work Order Picker Modal ──────────────────────────────────────────────────

function WorkOrderPickerModal({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean;
  selected: WorkOrder | null;
  onSelect: (wo: WorkOrder) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch fresh every time the modal opens
  useEffect(() => {
    if (!visible) return;
    setFetchError(false);
    setLoading(true);
    workOrdersApi.getAllNonPaginated()
      .then((res) => setWorkOrders(res.data.data ?? []))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = search.trim()
    ? workOrders.filter((wo) => {
      const q = search.toLowerCase();
      return (
        (wo.wo_number?.toLowerCase().includes(q) ?? false) ||
        wo.summary.toLowerCase().includes(q)
      );
    })
    : workOrders;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[woStyles.container, { paddingTop: insets.top || spacing.xl }]}>
        {/* Header */}
        <View style={woStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={woStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={woStyles.title}>Select Work Order</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Search */}
        <View style={woStyles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textLight} />
          <TextInput
            style={woStyles.searchInput}
            placeholder="Search work orders…"
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={woStyles.center}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : fetchError ? (
          <View style={woStyles.center}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textLight} />
            <Text style={woStyles.emptyText}>Could not load work orders</Text>
            <Text style={woStyles.emptySubText}>Check your connection and try again</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={woStyles.center}>
            <Ionicons name="briefcase-outline" size={40} color={colors.textLight} />
            <Text style={woStyles.emptyText}>
              {search.trim() ? 'No matching work orders' : 'No work orders found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(wo) => wo.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={woStyles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={woStyles.item}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
                activeOpacity={0.7}
              >
                <View style={woStyles.itemIcon}>
                  <Ionicons name="briefcase-outline" size={18} color={ACCENT} />
                </View>
                <View style={woStyles.itemInfo}>
                  <Text style={woStyles.itemNumber}>{item.wo_number ?? 'WO'}</Text>
                  <Text style={woStyles.itemSummary} numberOfLines={2}>{item.summary}</Text>
                  <View style={woStyles.itemMeta}>
                    <View style={[woStyles.statusDot, { backgroundColor: item.status === 'open' ? colors.info : colors.warning }]} />
                    <Text style={woStyles.itemStatus}>{item.status.replace('_', ' ')}</Text>
                  </View>
                </View>
                {selected?.id === item.id
                  ? <Ionicons name="checkmark-circle" size={22} color={ACCENT} />
                  : <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                }
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const woStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { ...typography.h4, color: colors.text },
  cancelText: { ...typography.body, color: ACCENT, width: 60 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySubText: { ...typography.bodySmall, color: colors.textLight, textAlign: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl'], gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: ACCENT + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemNumber: { ...typography.label, color: ACCENT },
  itemSummary: { ...typography.body, color: colors.text, marginTop: 2 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  itemStatus: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
});

// ─── Currency Picker Modal ────────────────────────────────────────────────────

function CurrencyPickerModal({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean; selected: Currency; onSelect: (c: Currency) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Select Currency</Text>
        {CURRENCIES.map((currency) => (
          <TouchableOpacity
            key={currency}
            style={styles.sheetOption}
            onPress={() => { onSelect(currency); onClose(); }}
          >
            <Text style={[styles.sheetOptionText, selected === currency && { color: ACCENT, fontWeight: '600' }]}>
              {currency}
            </Text>
            {selected === currency && <Ionicons name="checkmark" size={18} color={ACCENT} />}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

// ─── Catalog Picker Modal ─────────────────────────────────────────────────────

function CatalogPickerModal({
  visible, title, items, loading, onSelect, onClose,
}: {
  visible: boolean; title: string; items: CatalogEntry[]; loading: boolean;
  onSelect: (item: CatalogEntry) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, styles.sheetTall, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search…"
            placeholderTextColor={colors.textLight}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={ACCENT} /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sheetOption}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
              >
                <View style={styles.sheetOptionBody}>
                  <Text style={styles.sheetOptionText}>{item.name}</Text>
                  {item.description ? <Text style={styles.sheetOptionSub} numberOfLines={1}>{item.description}</Text> : null}
                </View>
                <View style={styles.catalogPriceBox}>
                  {item.price != null && <Text style={styles.catalogPrice}>{formatCurrency(item.price)}</Text>}
                  <Ionicons name="add-circle-outline" size={22} color={ACCENT} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.sheetEmpty}>No items found</Text>}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Item Editor Modal ────────────────────────────────────────────────────────

function ItemEditorModal({
  visible, draft, isNew, onSave, onClose,
}: {
  visible: boolean; draft: DraftItem | null; isNew: boolean;
  onSave: (item: DraftItem) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('0');
  const [taxRate, setTaxRate] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [errors, setErrors] = useState<{ name?: string; qty?: string }>({});

  // Sync from draft when modal opens
  useEffect(() => {
    if (visible && draft) {
      setName(draft.name);
      setDesc(draft.description);
      setQty(String(draft.quantity));
      setPrice(String(draft.unit_price));
      setTaxRate(String(draft.tax_rate));
      setDiscount(String(draft.discount));
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, draft?.localId]);

  if (!draft) return null;

  const qtyNum = parseFloat(qty) || 0;
  const priceNum = parseFloat(price) || 0;
  const taxNum = parseFloat(taxRate) || 0;
  const discountNum = parseFloat(discount) || 0;
  const subtotalLine = qtyNum * priceNum;
  const taxLine = subtotalLine * (taxNum / 100);
  const totalLine = subtotalLine - discountNum + taxLine;
  const typeColor = TYPE_COLORS[draft.type];

  const handleSave = () => {
    const next: { name?: string; qty?: string } = {};
    if (!name.trim()) next.name = 'Name is required';
    if (qtyNum <= 0) next.qty = 'Must be > 0';
    if (Object.keys(next).length > 0) { setErrors(next); return; }
    onSave({ ...draft, name: name.trim(), description: desc.trim(), quantity: qtyNum, unit_price: priceNum, tax_rate: taxNum, discount: discountNum });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.editorHeader}>
            <View style={[styles.editorTypeIcon, { backgroundColor: typeColor + '20' }]}>
              <Ionicons name={TYPE_ICONS[draft.type]} size={18} color={typeColor} />
            </View>
            <Text style={styles.sheetTitle}>
              {isNew ? `New ${TYPE_LABELS[draft.type]}` : 'Edit Item'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TextField
              label="Name" required value={name}
              onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }}
              placeholder="Item name" error={errors.name}
            />
            <TextField label="Description" value={desc} onChangeText={setDesc} placeholder="Optional description" multiline />
            <View style={styles.editorRow}>
              <View style={styles.editorColSmall}>
                <NumField label="Qty" value={qty}
                  onChangeText={(v) => { setQty(v); if (errors.qty) setErrors((e) => ({ ...e, qty: undefined })); }}
                  error={errors.qty}
                />
              </View>
              <View style={styles.editorColLarge}>
                <NumField label="Unit Price" prefix="$" value={price} onChangeText={setPrice} />
              </View>
            </View>
            <View style={styles.editorRow}>
              <View style={styles.editorColSmall}>
                <NumField label="Tax %" value={taxRate} onChangeText={setTaxRate} placeholder="0" />
              </View>
              <View style={styles.editorColLarge}>
                <NumField label="Discount ($)" prefix="-$" value={discount} onChangeText={setDiscount} placeholder="0" />
              </View>
            </View>
            <View style={styles.lineTotalBox}>
              <View style={styles.lineTotalRow}>
                <Text style={styles.lineTotalLabel}>Subtotal</Text>
                <Text style={styles.lineTotalVal}>{formatCurrency(subtotalLine)}</Text>
              </View>
              {discountNum > 0 && (
                <View style={styles.lineTotalRow}>
                  <Text style={styles.lineTotalLabel}>Discount</Text>
                  <Text style={[styles.lineTotalVal, { color: '#22c55e' }]}>-{formatCurrency(discountNum)}</Text>
                </View>
              )}
              {taxNum > 0 && (
                <View style={styles.lineTotalRow}>
                  <Text style={styles.lineTotalLabel}>Tax ({taxNum}%)</Text>
                  <Text style={styles.lineTotalVal}>+{formatCurrency(taxLine)}</Text>
                </View>
              )}
              <View style={[styles.lineTotalRow, styles.lineTotalDivider]}>
                <Text style={[styles.lineTotalLabel, { fontWeight: '700', color: colors.text }]}>Total</Text>
                <Text style={[styles.lineTotalVal, { fontWeight: '700', color: ACCENT }]}>{formatCurrency(totalLine)}</Text>
              </View>
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{isNew ? 'Add to Invoice' : 'Update Item'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Line Item Row ────────────────────────────────────────────────────────────

function LineItemRow({ item, onEdit, onDelete }: { item: DraftItem; onEdit: () => void; onDelete: () => void }) {
  const { colors: c } = useAppTheme();
  const typeColor = TYPE_COLORS[item.type];
  const total = lineTotal(item);
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onEdit} activeOpacity={0.7}>
      <View style={[styles.itemTypeIcon, { backgroundColor: typeColor + '15' }]}>
        <Ionicons name={TYPE_ICONS[item.type]} size={18} color={typeColor} />
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.itemDetail, { color: c.textSecondary }]}>
          {item.quantity} × {formatCurrency(item.unit_price)}
          {item.tax_rate > 0 ? ` + ${item.tax_rate}% tax` : ''}
          {item.discount > 0 ? ` − ${formatCurrency(item.discount)}` : ''}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemTotal, { color: c.text }]}>{formatCurrency(total)}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color={c.textLight} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  // Optional context passed in when launched from a service request (or work order).
  const { serviceRequestId, contactId, workOrderId } = useLocalSearchParams<{
    serviceRequestId?: string;
    contactId?: string;
    workOrderId?: string;
  }>();

  // ── Line items state ────────────────────────────────────────────────────────
  const [items, setItems] = useState<DraftItem[]>([]);
  const [editingDraft, setEditingDraft] = useState<DraftItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // ── Catalog state ───────────────────────────────────────────────────────────
  const [svcPickerOpen, setSvcPickerOpen] = useState(false);
  const [partsPickerOpen, setPartsPickerOpen] = useState(false);
  const [services, setServices] = useState<CatalogEntry[]>([]);
  const [parts, setParts] = useState<CatalogEntry[]>([]);
  const [loadingSvc, setLoadingSvc] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [svcLoaded, setSvcLoaded] = useState(false);
  const [partsLoaded, setPartsLoaded] = useState(false);

  // ── Contact state ───────────────────────────────────────────────────────────
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // ── Work order state ────────────────────────────────────────────────────────
  const [woPickerOpen, setWoPickerOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // ── Invoice meta ────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  // ── Submit state ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ── Prefill from launch context (service request / work order) ───────────────
  useEffect(() => {
    if (contactId) {
      contactsApi.getById(contactId)
        .then((res) => { if (res.data.data) setSelectedContact(res.data.data); })
        .catch(() => { });
    }
    if (workOrderId) {
      workOrdersApi.getById(workOrderId)
        .then((res) => { if (res.data.data) setSelectedWO(res.data.data); })
        .catch(() => { });
    }
  }, [contactId, workOrderId]);

  // ── Computed totals ─────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + lineSubtotal(i) - lineDiscount(i), 0);
  const totalTax = items.reduce((s, i) => s + lineTax(i), 0);
  const totalDiscount = items.reduce((s, i) => s + lineDiscount(i), 0);
  const grandTotal = subtotal + totalTax;

  // ── Lazy loaders ────────────────────────────────────────────────────────────
  const openServicePicker = useCallback(() => {
    if (!svcLoaded) {
      setLoadingSvc(true);
      servicesCatalogApi.getAll({ take: 100 })
        .then((res) => setServices((res.data.data ?? []).map(svcToCatalog)))
        .catch(() => { })
        .finally(() => { setLoadingSvc(false); setSvcLoaded(true); });
    }
    setSvcPickerOpen(true);
  }, [svcLoaded]);

  const openPartsPicker = useCallback(() => {
    if (!partsLoaded) {
      setLoadingParts(true);
      partsCatalogApi.getAll({ take: 100 })
        .then((res) => setParts((res.data.data ?? []).map(partToCatalog)))
        .catch(() => { })
        .finally(() => { setLoadingParts(false); setPartsLoaded(true); });
    }
    setPartsPickerOpen(true);
  }, [partsLoaded]);

  const openContactPicker = useCallback(() => {
    if (!contactsLoaded) {
      setLoadingContacts(true);
      contactsApi.getAllNonPaginated()
        .then((res) => setContacts(res.data.data ?? []))
        .catch(() => { })
        .finally(() => { setLoadingContacts(false); setContactsLoaded(true); });
    }
    setContactPickerOpen(true);
  }, [contactsLoaded]);

  // ── Item operations ─────────────────────────────────────────────────────────
  const addFromCatalog = (entry: CatalogEntry, type: ItemType) => {
    const draft = makeDraft(type, entry.name, entry.price ?? 0);
    setEditingDraft(draft);
    setIsNewItem(true);
    setEditorOpen(true);
  };

  const addManual = (type: ItemType) => {
    const draft = makeDraft(type);
    setEditingDraft(draft);
    setIsNewItem(true);
    setEditorOpen(true);
  };

  const editItem = (item: DraftItem) => {
    setEditingDraft({ ...item });
    setIsNewItem(false);
    setEditorOpen(true);
  };

  const deleteItem = (localId: string) => {
    Alert.alert('Remove Item', 'Remove this line item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems((prev) => prev.filter((i) => i.localId !== localId)) },
    ]);
  };

  const handleEditorSave = (saved: DraftItem) => {
    if (isNewItem) {
      setItems((prev) => [...prev, saved]);
    } else {
      setItems((prev) => prev.map((i) => (i.localId === saved.localId ? saved : i)));
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one line item to the invoice.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await invoicesApi.create({
        ...(selectedContact && { contact_id: selectedContact.id }),
        ...(selectedWO && { work_order_id: selectedWO.id }),
        ...(serviceRequestId && { service_request_id: serviceRequestId }),
        ...(notes.trim() && { notes: notes.trim() }),
        ...(dueDate && { due_date: dueDate }),
        currency,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(totalTax.toFixed(2)),
        discount: parseFloat(totalDiscount.toFixed(2)),
        total: parseFloat(grandTotal.toFixed(2)),
      });

      const invoiceId = res.data.data?.id;
      if (!invoiceId) throw new Error('No invoice ID returned');

      await Promise.allSettled(
        items.map((item) =>
          invoiceLineItemsApi.create({
            invoice_id: invoiceId,
            type: item.type,
            name: item.name,
            ...(item.description && { description: item.description }),
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            discount: item.discount,
            total: parseFloat(lineTotal(item).toFixed(2)),
          }),
        ),
      );

      router.replace(`/invoice/${invoiceId}`);
    } catch {
      Alert.alert('Error', 'Could not create invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: isDark ? c.background : '#F8F9FB' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>New Invoice</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color={ACCENT} />
            : <Text style={[styles.saveText, items.length === 0 && { color: c.textLight }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['3xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Contact & Work Order ─────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Linked To</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <SelectField
            label="Contact"
            value={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : ''}
            placeholder="Select contact (optional)"
            onPress={openContactPicker}
            onClear={() => setSelectedContact(null)}
          />
          <SelectField
            label="Work Order"
            value={selectedWO ? (selectedWO.wo_number ?? selectedWO.id.slice(0, 8)) : ''}
            placeholder="Select work order (optional)"
            onPress={() => setWoPickerOpen(true)}
            onClear={() => setSelectedWO(null)}
          />
        </View>

        {/* ── Line Items ───────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Line Items</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="receipt-outline" size={36} color={c.textLight} />
              <Text style={[styles.emptyItemsText, { color: c.textLight }]}>No items added yet</Text>
            </View>
          ) : (
            items.map((item, idx) => (
              <View key={item.localId}>
                <LineItemRow item={item} onEdit={() => editItem(item)} onDelete={() => deleteItem(item.localId)} />
                {idx < items.length - 1 && <View style={[styles.itemSep, { backgroundColor: c.divider }]} />}
              </View>
            ))
          )}
          <View style={[styles.addBtnRow, { borderTopColor: c.divider }]}>
            <TouchableOpacity style={[styles.addBtn, { borderColor, backgroundColor: inputBg }]} onPress={openServicePicker}>
              <Ionicons name="briefcase-outline" size={15} color={TYPE_COLORS.service} />
              <Text style={[styles.addBtnText, { color: TYPE_COLORS.service }]}>Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { borderColor, backgroundColor: inputBg }]} onPress={openPartsPicker}>
              <Ionicons name="cube-outline" size={15} color={TYPE_COLORS.part} />
              <Text style={[styles.addBtnText, { color: TYPE_COLORS.part }]}>Part</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { borderColor, backgroundColor: inputBg }]} onPress={() => addManual('travel')}>
              <Ionicons name="car-outline" size={15} color={TYPE_COLORS.travel} />
              <Text style={[styles.addBtnText, { color: TYPE_COLORS.travel }]}>Travel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { borderColor, backgroundColor: inputBg }]} onPress={() => addManual('other')}>
              <Ionicons name="add-outline" size={15} color={TYPE_COLORS.other} />
              <Text style={[styles.addBtnText, { color: TYPE_COLORS.other }]}>Other</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Totals ───────────────────────────────────────────────────────── */}
        {items.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Totals</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.totalVal, { color: c.text }]}>{formatCurrency(subtotal + totalDiscount, currency)}</Text>
              </View>
              {totalDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Discount</Text>
                  <Text style={[styles.totalVal, { color: '#22c55e' }]}>-{formatCurrency(totalDiscount, currency)}</Text>
                </View>
              )}
              {totalTax > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Tax</Text>
                  <Text style={[styles.totalVal, { color: c.text }]}>+{formatCurrency(totalTax, currency)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.totalRowFinal, { borderTopColor: c.divider }]}>
                <Text style={[styles.totalLabelFinal, { color: c.text }]}>Total</Text>
                <Text style={styles.totalValFinal}>{formatCurrency(grandTotal, currency)}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Details ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Details</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Due date */}
          <View style={styles.fieldWrap}>
            <FieldLabel text="Due Date" />
            <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: inputBg, borderColor }]} onPress={() => setCalendarOpen(true)} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={18} color={dueDate ? c.text : c.textLight} />
              <Text style={[styles.datePickerText, { color: c.text }, !dueDate && { color: c.textLight }]}>
                {dueDate ? dayjs(dueDate).format('MMM D, YYYY') : 'Select due date (optional)'}
              </Text>
              {dueDate ? (
                <TouchableOpacity onPress={() => setDueDate('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={c.textLight} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={16} color={c.textLight} />
              )}
            </TouchableOpacity>
          </View>

          {/* Currency */}
          <View style={styles.fieldWrap}>
            <FieldLabel text="Currency" />
            <TouchableOpacity style={[styles.selectBtn, { backgroundColor: inputBg, borderColor }]} onPress={() => setCurrencyPickerOpen(true)} activeOpacity={0.7}>
              <Text style={[styles.selectText, { color: c.text }]}>{currency}</Text>
              <Ionicons name="chevron-down" size={18} color={c.textLight} />
            </TouchableOpacity>
          </View>

          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any notes for the customer…"
            multiline
          />
        </View>
      </ScrollView>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <CalendarPickerModal
        visible={calendarOpen}
        value={dueDate}
        onConfirm={(date) => setDueDate(date)}
        onClose={() => setCalendarOpen(false)}
      />
      <ContactPickerModal
        visible={contactPickerOpen}
        contacts={contacts}
        loading={loadingContacts}
        selected={selectedContact}
        onSelect={setSelectedContact}
        onClose={() => setContactPickerOpen(false)}
      />
      <WorkOrderPickerModal
        visible={woPickerOpen}
        selected={selectedWO}
        onSelect={setSelectedWO}
        onClose={() => setWoPickerOpen(false)}
      />
      <CurrencyPickerModal
        visible={currencyPickerOpen}
        selected={currency}
        onSelect={setCurrency}
        onClose={() => setCurrencyPickerOpen(false)}
      />
      <CatalogPickerModal
        visible={svcPickerOpen}
        title="Add Service"
        items={services}
        loading={loadingSvc}
        onSelect={(entry) => addFromCatalog(entry, 'service')}
        onClose={() => setSvcPickerOpen(false)}
      />
      <CatalogPickerModal
        visible={partsPickerOpen}
        title="Add Part"
        items={parts}
        loading={loadingParts}
        onSelect={(entry) => addFromCatalog(entry, 'part')}
        onClose={() => setPartsPickerOpen(false)}
      />
      <ItemEditorModal
        visible={editorOpen}
        draft={editingDraft}
        isNew={isNewItem}
        onSave={handleEditorSave}
        onClose={() => { setEditorOpen(false); setEditingDraft(null); }}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 56, alignItems: 'flex-start' },
  headerTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },
  saveText: { ...typography.body, color: ACCENT, fontWeight: '700', textAlign: 'right' },
  saveTextDisabled: { color: colors.textLight },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xs },

  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },

  fieldWrap: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontSize: 11,
  },
  labelRequired: { color: '#ef4444' },
  input: {
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text,
  },
  inputMulti: { minHeight: 80, paddingTop: spacing.sm + 2 },
  inputError: { borderColor: '#ef4444' },
  errorText: { ...typography.bodySmall, color: '#ef4444', marginTop: 3 },
  numRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  numPrefix: { ...typography.body, color: colors.textSecondary, marginRight: spacing.xs },
  numInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  selectText: { ...typography.body, color: colors.text, flex: 1 },
  selectPlaceholder: { color: colors.textLight },

  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  datePickerText: { ...typography.body, color: colors.text, flex: 1 },
  datePickerPlaceholder: { color: colors.textLight },

  emptyItems: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyItemsText: { ...typography.body, color: colors.textLight },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  itemTypeIcon: {
    width: 36, height: 36, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 2 },
  itemName: { ...typography.body, fontWeight: '600', color: colors.text },
  itemDetail: { ...typography.caption, color: colors.textSecondary },
  itemRight: { alignItems: 'flex-end', gap: spacing.xs, flexShrink: 0 },
  itemTotal: { ...typography.body, fontWeight: '700', color: colors.text },
  itemSep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: 2 },

  addBtnRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.sm,
    backgroundColor: '#F8F9FB',
  },
  addBtnText: { ...typography.bodySmall, fontWeight: '700' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  totalRowFinal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalVal: { ...typography.body, color: colors.text, fontWeight: '600' },
  totalLabelFinal: { ...typography.h4, color: colors.text },
  totalValFinal: { ...typography.h4, color: ACCENT, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '70%',
  },
  sheetTall: { maxHeight: '80%' },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing.md,
  },
  sheetTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  sheetOptionBody: { flex: 1, gap: 2 },
  sheetOptionText: { ...typography.body, color: colors.text },
  sheetOptionSub: { ...typography.bodySmall, color: colors.textSecondary },
  sheetEmpty: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },

  catalogPriceBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  catalogPrice: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },

  editorHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  editorTypeIcon: { width: 32, height: 32, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  editorRow: { flexDirection: 'row', gap: spacing.md },
  editorColSmall: { flex: 2 },
  editorColLarge: { flex: 3 },

  lineTotalBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: 2,
  },
  lineTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  lineTotalDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, marginTop: spacing.xs, paddingTop: spacing.sm },
  lineTotalLabel: { ...typography.bodySmall, color: colors.textSecondary },
  lineTotalVal: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },

  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonText: { ...typography.body, color: '#fff', fontWeight: '700' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
});
