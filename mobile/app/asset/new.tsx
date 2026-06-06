import { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { assetsApi, contactsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Contact } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Appliance',
  'Security', 'Fire Safety', 'Elevator', 'Generator', 'Other',
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function buildCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateStr(s: string): { year: number; month: number; day: number } | null {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

// ─── DatePickerModal ──────────────────────────────────────────────────────────

function DatePickerModal({
  visible,
  value,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  value: string;
  onConfirm: (dateStr: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const today = new Date();

  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (!visible) return;
    const parsed = parseDateStr(value);
    if (parsed) {
      setDisplayYear(parsed.year);
      setDisplayMonth(parsed.month);
      setSelectedDay(parsed.day);
    } else {
      setDisplayYear(today.getFullYear());
      setDisplayMonth(today.getMonth());
      setSelectedDay(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const prevMonth = () => {
    if (displayMonth === 0) { setDisplayYear((y) => y - 1); setDisplayMonth(11); }
    else setDisplayMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (displayMonth === 11) { setDisplayYear((y) => y + 1); setDisplayMonth(0); }
    else setDisplayMonth((m) => m + 1);
  };

  const handleConfirm = () => {
    if (!selectedDay) return;
    onConfirm(toDateStr(displayYear, displayMonth, selectedDay));
    onClose();
  };

  const rows = buildCalendarRows(displayYear, displayMonth);

  const isToday = (day: number) =>
    day === today.getDate() &&
    displayMonth === today.getMonth() &&
    displayYear === today.getFullYear();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, styles.calSheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.modalHandle} />

        {/* Month navigation */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.calMonthTitle}>
            {MONTH_NAMES[displayMonth]} {displayYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week row */}
        <View style={styles.calRow}>
          {DAY_HEADERS.map((d) => (
            <Text key={d} style={styles.calDayHeader}>{d}</Text>
          ))}
        </View>

        {/* Date grid */}
        {rows.map((row, ri) => (
          <View key={ri} style={styles.calRow}>
            {row.map((day, ci) => {
              const selected = day !== null && day === selectedDay;
              const todayCell = day !== null && isToday(day);
              return (
                <TouchableOpacity
                  key={ci}
                  style={[
                    styles.calCell,
                    selected && styles.calCellSelected,
                    !selected && todayCell && styles.calCellToday,
                  ]}
                  onPress={() => day !== null && setSelectedDay(day)}
                  disabled={day === null}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calCellText,
                    selected && styles.calCellTextSelected,
                    !selected && todayCell && styles.calCellTextToday,
                  ]}>
                    {day ?? ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Actions */}
        <View style={styles.calActions}>
          <TouchableOpacity onPress={onClose} style={styles.calCancelBtn}>
            <Text style={styles.calCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.calConfirmBtn, !selectedDay && styles.calConfirmDisabled]}
            disabled={!selectedDay}
          >
            <Text style={styles.calConfirmText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── CategoryPickerModal ──────────────────────────────────────────────────────

function CategoryPickerModal({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Select Category</Text>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={styles.modalOption}
            onPress={() => { onSelect(cat); onClose(); }}
          >
            <Text style={[styles.modalOptionText, selected === cat && styles.modalOptionSelected]}>
              {cat}
            </Text>
            {selected === cat && <Ionicons name="checkmark" size={18} color={ACCENT} />}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
}

// ─── ContactPickerModal ───────────────────────────────────────────────────────

function ContactPickerModal({
  visible, contacts, loadingContacts, selected, onSelect, onClose,
}: {
  visible: boolean; contacts: Contact[]; loadingContacts: boolean;
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
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.modalSheet, styles.modalSheetTall, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Select Customer</Text>
        <View style={styles.modalSearch}>
          <Ionicons name="search-outline" size={16} color={colors.textLight} />
          <TextInput
            style={styles.modalSearchInput}
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
        {loadingContacts ? (
          <View style={styles.modalCentered}>
            <ActivityIndicator color={ACCENT} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => { onSelect(item); onClose(); setSearch(''); }}
              >
                <View style={styles.modalContactBody}>
                  <Text style={[styles.modalOptionText, selected?.id === item.id && styles.modalOptionSelected]}>
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.email ? (
                    <Text style={styles.modalContactEmail} numberOfLines={1}>{item.email}</Text>
                  ) : null}
                </View>
                {selected?.id === item.id && (
                  <Ionicons name="checkmark" size={18} color={ACCENT} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.modalEmpty}>No contacts found</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Shared field sub-components ──────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}{required && <Text style={styles.labelRequired}> *</Text>}
    </Text>
  );
}

function TextField({
  label, value, onChangeText, placeholder, required,
  multiline, keyboardType, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; required?: boolean; multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad'; error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Label text={label} required={required} />
      <TextInput
        style={[styles.input, multiline && styles.inputMulti, !!error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType ?? 'default'}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function DateField({
  label, value, onPress, onClear, error,
}: {
  label: string; value: string;
  onPress: () => void; onClear: () => void; error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Label text={label} />
      <TouchableOpacity
        style={[styles.selectBtn, !!error && styles.inputError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
          {value || 'Select date'}
        </Text>
        {value ? (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
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
      <Label text={label} />
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

// ─── Main screen ──────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  category: string;
  install_date: string;
  warranty_expiry: string;
  health_score: string;
  notes: string;
}

const INITIAL: FormState = {
  name: '', manufacturer: '', model: '', serial_number: '',
  category: '', install_date: '', warranty_expiry: '',
  health_score: '', notes: '',
};

export default function NewAssetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [installDatePickerOpen, setInstallDatePickerOpen] = useState(false);
  const [warrantyDatePickerOpen, setWarrantyDatePickerOpen] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    setLoadingContacts(true);
    contactsApi.getAllNonPaginated()
      .then((res) => setContacts(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, []);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Asset name is required';
    if (form.health_score.trim()) {
      const n = Number(form.health_score);
      if (isNaN(n) || n < 0 || n > 100)
        next.health_score = 'Enter a number between 0 and 100';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await assetsApi.create({
        name: form.name.trim(),
        ...(form.manufacturer.trim() && { manufacturer: form.manufacturer.trim() }),
        ...(form.model.trim() && { model: form.model.trim() }),
        ...(form.serial_number.trim() && { serial_number: form.serial_number.trim() }),
        ...(form.category && { category: form.category }),
        ...(form.install_date && { install_date: form.install_date }),
        ...(form.warranty_expiry && { warranty_expiry: form.warranty_expiry }),
        ...(form.health_score.trim() && { health_score: Number(form.health_score) }),
        ...(selectedContact && { contact_id: selectedContact.id }),
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create asset. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>New Asset</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color={ACCENT} />
            : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Basic Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextField
            label="Asset Name" required
            value={form.name} onChangeText={set('name')}
            placeholder="e.g. HVAC Unit – Rooftop"
            error={errors.name}
          />
          <SelectField
            label="Category" value={form.category}
            placeholder="Select category"
            onPress={() => setCategoryPickerOpen(true)}
            onClear={() => setForm((f) => ({ ...f, category: '' }))}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Identification</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextField label="Manufacturer" value={form.manufacturer} onChangeText={set('manufacturer')} placeholder="e.g. Carrier" />
          <TextField label="Model" value={form.model} onChangeText={set('model')} placeholder="e.g. 24ACC636A003" />
          <TextField label="Serial Number" value={form.serial_number} onChangeText={set('serial_number')} placeholder="e.g. SN-2024-001234" />
        </View>

        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Dates</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <DateField
            label="Install Date"
            value={form.install_date}
            onPress={() => setInstallDatePickerOpen(true)}
            onClear={() => setForm((f) => ({ ...f, install_date: '' }))}
          />
          <DateField
            label="Warranty Expiry"
            value={form.warranty_expiry}
            onPress={() => setWarrantyDatePickerOpen(true)}
            onClear={() => setForm((f) => ({ ...f, warranty_expiry: '' }))}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Health & Assignment</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextField
            label="Health Score (0 – 100)"
            value={form.health_score} onChangeText={set('health_score')}
            placeholder="e.g. 85.5" keyboardType="decimal-pad"
            error={errors.health_score}
          />
          <SelectField
            label="Customer (Contact)"
            value={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : ''}
            placeholder="Select customer"
            onPress={() => setContactPickerOpen(true)}
            onClear={() => setSelectedContact(null)}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Notes</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextField label="Notes" value={form.notes} onChangeText={set('notes')} placeholder="Location details, special instructions…" multiline />
        </View>
      </ScrollView>

      <DatePickerModal
        visible={installDatePickerOpen}
        value={form.install_date}
        onConfirm={(d) => setForm((f) => ({ ...f, install_date: d }))}
        onClose={() => setInstallDatePickerOpen(false)}
      />
      <DatePickerModal
        visible={warrantyDatePickerOpen}
        value={form.warranty_expiry}
        onConfirm={(d) => setForm((f) => ({ ...f, warranty_expiry: d }))}
        onClose={() => setWarrantyDatePickerOpen(false)}
      />
      <CategoryPickerModal
        visible={categoryPickerOpen}
        selected={form.category}
        onSelect={(v) => setForm((f) => ({ ...f, category: v }))}
        onClose={() => setCategoryPickerOpen(false)}
      />
      <ContactPickerModal
        visible={contactPickerOpen}
        contacts={contacts}
        loadingContacts={loadingContacts}
        selected={selectedContact}
        onSelect={setSelectedContact}
        onClose={() => setContactPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 48, alignItems: 'flex-start' },
  headerTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },
  saveBtn: { ...typography.body, color: ACCENT, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  sectionTitle: {
    ...typography.label, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: borderRadius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: spacing.sm,
  },
  fieldWrap: { marginBottom: spacing.md },
  label: {
    ...typography.label, color: colors.textSecondary,
    marginBottom: spacing.xs, textTransform: 'uppercase',
    letterSpacing: 0.4, fontSize: 11,
  },
  labelRequired: { color: '#ef4444' },
  input: {
    backgroundColor: '#F8F9FB', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    ...typography.body, color: colors.text,
  },
  inputMulti: { minHeight: 96, paddingTop: spacing.sm + 2 },
  inputError: { borderColor: '#ef4444' },
  errorText: { ...typography.bodySmall, color: '#ef4444', marginTop: 3 },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FB', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.sm,
  },
  selectText: { ...typography.body, color: colors.text, flex: 1 },
  selectPlaceholder: { color: colors.textLight },

  // ── Modal shared ────────────────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '55%',
  },
  modalSheetTall: { maxHeight: '75%' },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  modalOptionText: { ...typography.body, color: colors.text },
  modalOptionSelected: { color: ACCENT, fontWeight: '600' },
  modalContactBody: { flex: 1, gap: 2 },
  modalContactEmail: { ...typography.bodySmall, color: colors.textSecondary },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#F8F9FB', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md,
  },
  modalSearchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  modalCentered: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  modalEmpty: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', paddingVertical: spacing.xl,
  },

  // ── Calendar ────────────────────────────────────────────────────────────────
  calSheet: { maxHeight: '75%' },
  calHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.md,
  },
  calNavBtn: { padding: spacing.sm },
  calMonthTitle: { ...typography.h4, color: colors.text },
  calRow: { flexDirection: 'row', marginBottom: 2 },
  calDayHeader: {
    flex: 1, textAlign: 'center',
    ...typography.label, color: colors.textSecondary,
    fontSize: 11, paddingVertical: spacing.xs,
  },
  calCell: {
    flex: 1, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 100, margin: 1,
  },
  calCellSelected: { backgroundColor: ACCENT },
  calCellToday: { borderWidth: 1.5, borderColor: ACCENT },
  calCellText: { ...typography.body, color: colors.text, fontSize: 14 },
  calCellTextSelected: { color: '#fff', fontWeight: '700' },
  calCellTextToday: { color: ACCENT, fontWeight: '600' },
  calActions: {
    flexDirection: 'row', justifyContent: 'flex-end',
    gap: spacing.md, marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
  },
  calCancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  calCancelText: { ...typography.body, color: colors.textSecondary },
  calConfirmBtn: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm,
    backgroundColor: ACCENT, borderRadius: borderRadius.md,
  },
  calConfirmDisabled: { backgroundColor: colors.textLight },
  calConfirmText: { ...typography.body, color: '#fff', fontWeight: '600' },
});
