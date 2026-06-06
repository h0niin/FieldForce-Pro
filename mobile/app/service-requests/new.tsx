import { useState } from 'react';
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
import { serviceRequestsApi, contactsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Contact } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6c757d',
  medium: '#0ea5e9',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const CHANNELS = ['phone', 'email', 'portal', 'webform', 'whatsapp', 'api'] as const;

const CHANNEL_LABELS: Record<string, string> = {
  phone: 'Phone',
  email: 'Email',
  portal: 'Customer Portal',
  webform: 'Web Form',
  whatsapp: 'WhatsApp',
  api: 'API',
};

const CHANNEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  phone: 'call-outline',
  email: 'mail-outline',
  portal: 'globe-outline',
  webform: 'document-text-outline',
  whatsapp: 'chatbubble-ellipses-outline',
  api: 'code-slash-outline',
};

const CATEGORIES = [
  'HVAC', 'Plumbing', 'Electrical', 'Appliance',
  'Security', 'Fire Safety', 'Elevator', 'Generator',
  'IT Support', 'Cleaning', 'Pest Control', 'Other',
];

// ─── Reusable field components ────────────────────────────────────────────────

function Label({ text, required }: { text: string; required?: boolean }) {
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
      <Label text={label} required={required} />
      <TextInput
        style={[styles.input, multiline && styles.inputMulti, !!error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        autoCapitalize="sentences"
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function SelectField({
  label, value, placeholder, onPress, onClear, required, error,
}: {
  label: string; value: string; placeholder: string;
  onPress: () => void; onClear: () => void;
  required?: boolean; error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Label text={label} required={required} />
      <TouchableOpacity
        style={[styles.selectBtn, !!error && styles.inputError]}
        onPress={onPress}
        activeOpacity={0.7}
      >
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ─── Priority picker modal ────────────────────────────────────────────────────

function PriorityModal({
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
        <Text style={styles.modalTitle}>Select Priority</Text>
        {PRIORITIES.map((p) => {
          const color = PRIORITY_COLORS[p];
          const isSelected = selected === p;
          return (
            <TouchableOpacity
              key={p}
              style={styles.modalOption}
              onPress={() => { onSelect(p); onClose(); }}
            >
              <View style={[styles.priorityDot, { backgroundColor: color }]} />
              <Text style={[styles.modalOptionText, isSelected && { color: ACCENT, fontWeight: '600' }]}>
                {PRIORITY_LABELS[p]}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={18} color={ACCENT} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

// ─── Channel picker modal ─────────────────────────────────────────────────────

function ChannelModal({
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
        <Text style={styles.modalTitle}>Select Channel</Text>
        {CHANNELS.map((ch) => {
          const isSelected = selected === ch;
          return (
            <TouchableOpacity
              key={ch}
              style={styles.modalOption}
              onPress={() => { onSelect(ch); onClose(); }}
            >
              <Ionicons name={CHANNEL_ICONS[ch]} size={18} color={colors.textSecondary} />
              <Text style={[styles.modalOptionText, isSelected && { color: ACCENT, fontWeight: '600' }]}>
                {CHANNEL_LABELS[ch]}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={18} color={ACCENT} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

// ─── Category picker modal ────────────────────────────────────────────────────

function CategoryModal({
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
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={styles.modalOption}
              onPress={() => { onSelect(cat); onClose(); }}
            >
              <Text style={[styles.modalOptionText, isSelected && { color: ACCENT, fontWeight: '600' }]}>
                {cat}
              </Text>
              {isSelected && <Ionicons name="checkmark" size={18} color={ACCENT} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Modal>
  );
}

// ─── Contact picker modal ─────────────────────────────────────────────────────

function ContactModal({
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
        <Text style={styles.modalTitle}>Select Contact</Text>
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
                  <Text style={[styles.modalOptionText, selected?.id === item.id && { color: ACCENT, fontWeight: '600' }]}>
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

// ─── Screen ───────────────────────────────────────────────────────────────────

interface FormState {
  subject: string;
  description: string;
  priority: string;
  category: string;
  channel: string;
}

const INITIAL: FormState = {
  subject: '',
  description: '',
  priority: 'medium',
  category: '',
  channel: 'phone',
};

export default function NewServiceRequestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsLoaded, setContactsLoaded] = useState(false);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const openContactModal = () => {
    if (!contactsLoaded) {
      setLoadingContacts(true);
      contactsApi.getAllNonPaginated()
        .then((res) => setContacts(res.data.data ?? []))
        .catch(() => {})
        .finally(() => { setLoadingContacts(false); setContactsLoaded(true); });
    }
    setContactModalOpen(true);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!form.priority) next.priority = 'Priority is required';
    if (!form.channel) next.channel = 'Channel is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await serviceRequestsApi.create({
        subject: form.subject.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
        priority: form.priority,
        ...(form.category && { category: form.category }),
        channel: form.channel,
        ...(selectedContact && { contact_id: selectedContact.id }),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create service request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColor = PRIORITY_COLORS[form.priority] ?? colors.textSecondary;

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
        <Text style={[styles.headerTitle, { color: c.text }]}>New Request</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={submitting}>
          {submitting
            ? <ActivityIndicator size="small" color={ACCENT} />
            : <Text style={styles.saveBtn}>Submit</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Priority quick-select bar */}
        <View style={styles.priorityBar}>
          {PRIORITIES.map((p) => {
            const isActive = form.priority === p;
            const col = PRIORITY_COLORS[p];
            return (
              <TouchableOpacity
                key={p}
                style={[styles.priorityChip, isActive && { backgroundColor: col, borderColor: col }]}
                onPress={() => set('priority')(p)}
                activeOpacity={0.7}
              >
                {p === 'urgent' && <Ionicons name="flash" size={12} color={isActive ? '#fff' : col} />}
                <Text style={[styles.priorityChipText, { color: isActive ? '#fff' : col }]}>
                  {PRIORITY_LABELS[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.priority ? <Text style={[styles.errorText, { marginBottom: spacing.sm }]}>{errors.priority}</Text> : null}

        {/* Request details */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Request Details</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <TextField
            label="Subject" required
            value={form.subject} onChangeText={set('subject')}
            placeholder="Brief description of the issue"
            error={errors.subject}
          />
          <TextField
            label="Description"
            value={form.description} onChangeText={set('description')}
            placeholder="Additional details, symptoms, location…"
            multiline
          />
        </View>

        {/* Classification */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Classification</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <SelectField
            label="Channel" required
            value={form.channel ? CHANNEL_LABELS[form.channel] : ''}
            placeholder="How was this request received?"
            onPress={() => setChannelModalOpen(true)}
            onClear={() => set('channel')('')}
            error={errors.channel}
          />
          <SelectField
            label="Category"
            value={form.category}
            placeholder="Select category (optional)"
            onPress={() => setCategoryModalOpen(true)}
            onClear={() => set('category')('')}
          />
        </View>

        {/* Contact */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Contact</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <SelectField
            label="Linked Contact"
            value={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : ''}
            placeholder="Search contacts (optional)"
            onPress={openContactModal}
            onClear={() => setSelectedContact(null)}
          />
        </View>

        {/* Priority indicator strip */}
        <View style={[styles.priorityStrip, { backgroundColor: priorityColor + '15', borderLeftColor: priorityColor }]}>
          <Ionicons name="flag-outline" size={16} color={priorityColor} />
          <Text style={[styles.priorityStripText, { color: priorityColor }]}>
            {PRIORITY_LABELS[form.priority] ?? '—'} priority
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <PriorityModal
        visible={priorityModalOpen}
        selected={form.priority}
        onSelect={set('priority')}
        onClose={() => setPriorityModalOpen(false)}
      />
      <ChannelModal
        visible={channelModalOpen}
        selected={form.channel}
        onSelect={set('channel')}
        onClose={() => setChannelModalOpen(false)}
      />
      <CategoryModal
        visible={categoryModalOpen}
        selected={form.category}
        onSelect={set('category')}
        onClose={() => setCategoryModalOpen(false)}
      />
      <ContactModal
        visible={contactModalOpen}
        contacts={contacts}
        loadingContacts={loadingContacts}
        selected={selectedContact}
        onSelect={setSelectedContact}
        onClose={() => setContactModalOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 56, alignItems: 'flex-start' },
  headerTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },
  saveBtn: { ...typography.body, color: ACCENT, fontWeight: '700' },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xs },

  // ── Priority bar ──────────────────────────────────────────────────────────
  priorityBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  priorityChipText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },

  // ── Section ───────────────────────────────────────────────────────────────
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

  // ── Fields ────────────────────────────────────────────────────────────────
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
  inputMulti: { minHeight: 88, paddingTop: spacing.sm + 2 },
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

  // ── Priority strip ────────────────────────────────────────────────────────
  priorityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  priorityStripText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxHeight: '60%',
  },
  modalSheetTall: { maxHeight: '78%' },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider,
  },
  modalOptionText: { ...typography.body, color: colors.text, flex: 1 },
  priorityDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
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
});
