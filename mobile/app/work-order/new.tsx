import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
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
import { workOrdersApi } from '@/api/endpoints';
import { CategoryPickerModal } from '@/components/CategoryPickerModal';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { ContactPickerModal } from '@/components/ContactPickerModal';
import { ServiceLocationPickerModal } from '@/components/ServiceLocationPickerModal';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { PRIORITY_COLORS } from '@/utils/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';
import type { Contact, ServiceLocation } from '@/types/models';

// ─── Reusable field primitives ────────────────────────────────────────────────

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
    const { colors } = useAppTheme();
    return (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
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
    const { colors, inputBg, borderColor } = useAppTheme();
    return (
        <View style={styles.fieldWrap}>
            <FieldLabel text={label} required={required} />
            <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: colors.text }, multiline && styles.inputMulti, !!error && styles.inputError]}
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
            {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
        </View>
    );
}

// ─── Priority selector ────────────────────────────────────────────────────────

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
type Priority = typeof PRIORITIES[number];

const PRIORITY_LABELS: Record<Priority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

function PrioritySelector({
    value,
    onChange,
}: {
    value: Priority;
    onChange: (v: Priority) => void;
}) {
    return (
        <View style={styles.fieldWrap}>
            <FieldLabel text="Priority" />
            <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                    const color = PRIORITY_COLORS[p];
                    const selected = value === p;
                    return (
                        <TouchableOpacity
                            key={p}
                            style={[
                                styles.priorityChip,
                                { borderColor: color },
                                selected && { backgroundColor: color },
                            ]}
                            onPress={() => onChange(p)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.priorityChipText, { color: selected ? '#fff' : color }]}>
                                {PRIORITY_LABELS[p]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Date/time helper ─────────────────────────────────────────────────────────

function formatDisplayDate(d: Date | null): string {
    if (!d) return '';
    return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NewWorkOrderScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [category, setCategory] = useState('');
    const [scheduledStart, setScheduledStart] = useState<Date | null>(null);

    // Customer Info state
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);

    // Date picker visibility
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const [summaryError, setSummaryError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Other pickers
    const [categories, setCategories] = useState<string[]>([]);
    const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
    const [contactPickerOpen, setContactPickerOpen] = useState(false);
    const [locationPickerOpen, setLocationPickerOpen] = useState(false);

    // Fetch existing WO categories for picker suggestions
    useEffect(() => {
        workOrdersApi.getAll({ take: 200 }).then((res) => {
            const cats = Array.from(
                new Set(
                    (res.data.data ?? [])
                        .map((wo) => wo.category)
                        .filter((c): c is string => !!c),
                ),
            ).sort();
            setCategories(cats);
        }).catch(() => { });
    }, []);

    const handleSave = async () => {
        if (!summary.trim()) {
            setSummaryError('Summary is required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await workOrdersApi.create({
                summary: summary.trim(),
                ...(description.trim() && { description: description.trim() }),
                priority,
                ...(category.trim() && { category: category.trim() }),
                ...(scheduledStart && { scheduled_start: scheduledStart.toISOString() }),
                ...(selectedContact && { contact_id: selectedContact.id }),
                ...(selectedLocation && { location_id: selectedLocation.id }),
            });
            const newId = res.data.data?.id;
            if (newId) {
                router.replace(`/work-order/${newId}`);
            } else {
                router.back();
            }
        } catch {
            Alert.alert('Error', 'Could not create work order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.root, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>New Work Order</Text>
                <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={submitting}>
                    {submitting
                        ? <ActivityIndicator size="small" color={ACCENT} />
                        : <Text style={[styles.saveText, !summary.trim() && styles.saveTextDisabled]}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['3xl'] }]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Summary & Description */}
                <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : '#64748B' }]}>Basic Info</Text>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                    <TextField
                        label="Summary"
                        required
                        value={summary}
                        onChangeText={(v) => { setSummary(v); if (summaryError) setSummaryError(''); }}
                        placeholder="e.g. Fix broken HVAC unit in Room 4B"
                        error={summaryError}
                    />

                    {/* Category — full picker modal */}
                    <View style={styles.fieldWrap}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                        <TouchableOpacity
                            style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor }]}
                            onPress={() => setCategoryPickerOpen(true)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[styles.pickerBtnText, { color: colors.text }, !category && styles.pickerBtnPlaceholder]}
                                numberOfLines={1}
                            >
                                {category || 'Select or type a category…'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    <TextField
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Additional details about this job…"
                        multiline
                    />
                </View>

                {/* Customer Info */}
                <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : '#64748B' }]}>Customer Info</Text>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                    {/* Contact */}
                    <View style={styles.fieldWrap}>
                        <FieldLabel text="Contact" />
                        <TouchableOpacity
                            style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor }]}
                            onPress={() => setContactPickerOpen(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.pickerContent}>
                                {selectedContact ? (
                                    <>
                                        <Text style={[styles.pickerBtnText, { color: colors.text }]}>
                                            {selectedContact.first_name} {selectedContact.last_name}
                                        </Text>
                                        {selectedContact.phone && (
                                            <Text style={[styles.pickerSubText, { color: colors.textSecondary }]}>{selectedContact.phone}</Text>
                                        )}
                                    </>
                                ) : (
                                    <Text style={styles.pickerBtnPlaceholder}>Select a contact…</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>

                    {/* Location */}
                    <View style={styles.fieldWrap}>
                        <FieldLabel text="Service Location" />
                        <TouchableOpacity
                            style={[styles.pickerBtn, { backgroundColor: inputBg, borderColor }]}
                            onPress={() => setLocationPickerOpen(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.pickerContent}>
                                {selectedLocation ? (
                                    <Text style={styles.pickerBtnText} numberOfLines={2}>
                                        {selectedLocation.address}
                                    </Text>
                                ) : (
                                    <Text style={styles.pickerBtnPlaceholder}>Select a location…</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-down" size={16} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Priority */}
                <Text style={[styles.sectionTitle, { color: isDark ? colors.textSecondary : '#64748B' }]}>Priority</Text>
                <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                    <PrioritySelector value={priority} onChange={setPriority} />
                </View>

                {/* Schedule */}
                <Text style={styles.sectionTitle}>Schedule</Text>
                <View style={styles.card}>
                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Scheduled Date</Text>
                        <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() => setDatePickerOpen(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                            <Text
                                style={[
                                    styles.datePickerBtnText,
                                    !scheduledStart && styles.datePickerBtnPlaceholder,
                                ]}
                            >
                                {scheduledStart ? formatDisplayDate(scheduledStart) : 'Tap to select date'}
                            </Text>
                            {scheduledStart && (
                                <TouchableOpacity
                                    onPress={() => setScheduledStart(null)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="close-circle" size={18} color={colors.textLight} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Save button */}
                <TouchableOpacity
                    style={[styles.saveBtn, !summary.trim() && { opacity: 0.5 }]}
                    onPress={handleSave}
                    disabled={submitting || !summary.trim()}
                    activeOpacity={0.8}
                >
                    {submitting
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>Create Work Order</Text>
                        </>}
                </TouchableOpacity>
            </ScrollView>

            <CategoryPickerModal
                visible={categoryPickerOpen}
                categories={categories}
                value={category}
                onSelect={(val) => {
                    setCategory(val);
                    // If this is a brand-new category, add it to the local list
                    // so it appears the next time the picker is opened
                    if (val && !categories.includes(val)) {
                        setCategories((prev) => [...prev, val].sort());
                    }
                }}
                onClose={() => setCategoryPickerOpen(false)}
                title="Work Order Category"
            />

            {/* Date picker */}
            <DateTimePickerModal
                visible={datePickerOpen}
                value={scheduledStart?.toISOString()}
                onConfirm={(date) => setScheduledStart(date)}
                onClose={() => setDatePickerOpen(false)}
                title="Scheduled Date"
            />

            <ContactPickerModal
                visible={contactPickerOpen}
                onClose={() => setContactPickerOpen(false)}
                onSelect={(contact) => {
                    setSelectedContact(contact);
                    // Clear location if it doesn't belong to the new contact
                    if (selectedLocation && selectedLocation.contact_id !== contact.id) {
                        setSelectedLocation(null);
                    }
                }}
            />

            <ServiceLocationPickerModal
                visible={locationPickerOpen}
                onClose={() => setLocationPickerOpen(false)}
                onSelect={setSelectedLocation}
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
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
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
        gap: spacing.xs,
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
    errorMsg: { ...typography.bodySmall, color: '#ef4444', marginTop: 3 },

    // Priority chips
    priorityRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    priorityChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
    },
    priorityChipText: { ...typography.label, textTransform: 'capitalize' },

    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FB',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        gap: spacing.xs,
        minHeight: 48,
    },
    pickerContent: { flex: 1 },
    pickerBtnText: { ...typography.body, color: colors.text },
    pickerSubText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    pickerBtnPlaceholder: { color: colors.textLight },

    // Date picker button
    datePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: '#F8F9FB',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
    },
    datePickerBtnText: { ...typography.body, color: colors.text, flex: 1 },
    datePickerBtnPlaceholder: { color: colors.textLight },

    // Bottom save button
    saveBtn: {
        flexDirection: 'row',
        backgroundColor: ACCENT,
        borderRadius: 10,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    saveBtnText: { ...typography.button, color: '#fff' },
});
