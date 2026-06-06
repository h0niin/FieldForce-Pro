import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
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
import { goBack } from '@/utils/navigation';
import dayjs from 'dayjs';
import { appointmentsApi, workOrdersApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth.store';
import { DateTimePickerModal } from '@/components/DateTimePickerModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
const ACCENT = '#4F6BF6';
import type { WorkOrder } from '@/types/models';

// ─── Work Order Picker Modal ───────────────────────────────────────────────────

function WorkOrderPickerModal({
    visible,
    onClose,
    onSelect,
}: {
    visible: boolean;
    onClose: () => void;
    onSelect: (wo: WorkOrder) => void;
}) {
    const insets = useSafeAreaInsets();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await workOrdersApi.getAll({ take: 50 });
            setWorkOrders(res.data.data ?? []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) fetchWorkOrders();
    }, [visible, fetchWorkOrders]);

    const filtered = workOrders.filter(
        (w) =>
            w.wo_number?.toLowerCase().includes(search.toLowerCase()) ||
            w.summary?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[pickerStyles.container, { paddingTop: insets.top || spacing.xl, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                {/* Header */}
                <View style={[pickerStyles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={pickerStyles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[pickerStyles.title, { color: themeColors.text }]}>Select Work Order</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Search */}
                <View style={[pickerStyles.searchRow, { backgroundColor: inputBg, borderColor }]}>
                    <Ionicons name="search-outline" size={16} color={themeColors.textLight} />
                    <TextInput
                        style={[pickerStyles.searchInput, { color: themeColors.text }]}
                        placeholder="Search work orders..."
                        placeholderTextColor={themeColors.textLight}
                        value={search}
                        onChangeText={setSearch}
                        autoCorrect={false}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={16} color={themeColors.textLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* List */}
                {loading ? (
                    <View style={pickerStyles.center}>
                        <ActivityIndicator color={ACCENT} />
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={pickerStyles.center}>
                        <Ionicons name="briefcase-outline" size={40} color={colors.textLight} />
                        <Text style={pickerStyles.emptyText}>No work orders found</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={pickerStyles.list}>
                        {filtered.map((wo) => (
                            <TouchableOpacity
                                key={wo.id}
                                style={[pickerStyles.item, { backgroundColor: cardBg, borderColor }]}
                                onPress={() => { onSelect(wo); onClose(); }}
                                activeOpacity={0.7}
                            >
                                <View style={pickerStyles.itemIcon}>
                                    <Ionicons name="briefcase-outline" size={18} color={ACCENT} />
                                </View>
                                <View style={pickerStyles.itemInfo}>
                                    <Text style={pickerStyles.itemNumber}>{wo.wo_number ?? 'WO'}</Text>
                                    <Text style={[pickerStyles.itemSummary, { color: themeColors.text }]} numberOfLines={2}>
                                        {wo.summary}
                                    </Text>
                                    <View style={pickerStyles.itemMeta}>
                                        <View
                                            style={[
                                                pickerStyles.statusDot,
                                                { backgroundColor: wo.status === 'open' ? colors.info : colors.warning },
                                            ]}
                                        />
                                        <Text style={pickerStyles.itemStatus}>{wo.status.replace('_', ' ')}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const pickerStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFF',
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
        backgroundColor: '#F8F9FB',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    emptyText: { ...typography.body, color: colors.textSecondary },
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: ACCENT + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemInfo: { flex: 1 },
    itemNumber: { ...typography.label, color: ACCENT },
    itemSummary: { ...typography.body, color: colors.text, marginTop: 2 },
    itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    itemStatus: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
});

// ─── Main Create Screen ────────────────────────────────────────────────────────

export default function CreateAppointmentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    // Form state
    const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
    const [scheduledStart, setScheduledStart] = useState<Date | null>(null);
    const [scheduledEnd, setScheduledEnd] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');

    // UI state
    const [showWoPicker, setShowWoPicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleStartConfirm = (date: Date) => {
        setScheduledStart(date);
    };

    const handleSubmit = async () => {
        if (!selectedWorkOrder) {
            Alert.alert('Required', 'Please select a work order for this appointment.');
            return;
        }
        if (!scheduledStart) {
            Alert.alert('Required', 'Please set a start date and time.');
            return;
        }
        if (!scheduledEnd) {
            Alert.alert('Required', 'Please set an end date and time.');
            return;
        }
        if (!user?.id) {
            Alert.alert('Error', 'Unable to determine your user ID. Please log in again.');
            return;
        }
        if (dayjs(scheduledEnd).isBefore(dayjs(scheduledStart))) {
            Alert.alert('Invalid Times', 'End time must be after start time.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await appointmentsApi.create({
                work_order_id: selectedWorkOrder.id,
                agent_id: user.id,
                scheduled_start: scheduledStart.toISOString(),
                scheduled_end: scheduledEnd.toISOString(),
                notes: notes.trim() || undefined,
            });

            const created = res.data.data;
            Alert.alert('Appointment Created', 'The appointment has been scheduled.', [
                {
                    text: 'View',
                    onPress: () => router.replace(`/appointment/${created?.id}`),
                },
                {
                    text: 'Back to Schedule',
                    onPress: () => router.back(),
                },
            ]);
        } catch {
            Alert.alert('Error', 'Failed to create the appointment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (date: Date) =>
        dayjs(date).format('ddd, MMM D · h:mm A');

    const durationMinutes =
        scheduledStart && scheduledEnd
            ? dayjs(scheduledEnd).diff(dayjs(scheduledStart), 'minute')
            : 0;
    const durationLabel =
        durationMinutes >= 60
            ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ''}`
            : `${durationMinutes}m`;

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing['4xl'] },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back header */}
                <View style={styles.navRow}>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: cardBg, borderColor }]} onPress={() => goBack()}>
                        <Ionicons name="arrow-back" size={22} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: themeColors.text }]}>New Appointment</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Work Order */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>WORK ORDER *</Text>
                    <TouchableOpacity
                        style={[styles.selectRow, { backgroundColor: cardBg }, !selectedWorkOrder && [styles.selectRowEmpty, { borderColor }]]}
                        onPress={() => setShowWoPicker(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.selectIcon}>
                            <Ionicons name="briefcase-outline" size={20} color={ACCENT} />
                        </View>
                        {selectedWorkOrder ? (
                            <View style={styles.selectInfo}>
                                <Text style={styles.selectMain}>{selectedWorkOrder.wo_number ?? 'WO'}</Text>
                                <Text style={[styles.selectSub, { color: themeColors.textSecondary }]} numberOfLines={1}>
                                    {selectedWorkOrder.summary}
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.selectPlaceholder, { color: themeColors.textLight }]}>Select a work order…</Text>
                        )}
                        <Ionicons name="chevron-down" size={18} color={themeColors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Schedule Times */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>SCHEDULE *</Text>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                        {/* Start */}
                        <TouchableOpacity style={styles.timeRow} onPress={() => setShowStartPicker(true)}>
                            <View style={[styles.timeIcon, { backgroundColor: ACCENT + '15' }]}>
                                <Ionicons name="play-outline" size={16} color={ACCENT} />
                            </View>
                            <View style={styles.timeInfo}>
                                <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>Start</Text>
                                {scheduledStart ? (
                                    <Text style={[styles.timeValue, { color: themeColors.text }]}>{formatDateTime(scheduledStart)}</Text>
                                ) : (
                                    <Text style={[styles.timePlaceholder, { color: themeColors.textLight }]}>Tap to set date & time…</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={themeColors.textLight} />
                        </TouchableOpacity>

                        <View style={[styles.timeDivider, { backgroundColor: themeColors.divider }]} />

                        {/* End */}
                        <TouchableOpacity style={styles.timeRow} onPress={() => setShowEndPicker(true)}>
                            <View style={[styles.timeIcon, { backgroundColor: themeColors.success + '15' }]}>
                                <Ionicons name="stop-outline" size={16} color={themeColors.success} />
                            </View>
                            <View style={styles.timeInfo}>
                                <Text style={[styles.timeLabel, { color: themeColors.textSecondary }]}>End</Text>
                                {scheduledEnd ? (
                                    <Text style={[styles.timeValue, { color: themeColors.text }]}>{formatDateTime(scheduledEnd)}</Text>
                                ) : (
                                    <Text style={[styles.timePlaceholder, { color: themeColors.textLight }]}>Tap to set date & time…</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={themeColors.textLight} />
                        </TouchableOpacity>

                        {/* Duration pill — only when both are set */}
                        {durationMinutes > 0 && (
                            <View style={[styles.durationRow, { borderTopColor: themeColors.divider }]}>
                                <Ionicons name="time-outline" size={13} color={themeColors.textSecondary} />
                                <Text style={[styles.durationText, { color: themeColors.textSecondary }]}>Duration: {durationLabel}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Assigned To */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>ASSIGNED TO</Text>
                    <View style={[styles.assignedCard, { backgroundColor: cardBg, borderColor }]}>
                        <View style={styles.assignedAvatar}>
                            <Text style={styles.assignedAvatarText}>
                                {user
                                    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                                    : '??'}
                            </Text>
                        </View>
                        <View style={styles.assignedInfo}>
                            <Text style={[styles.assignedName, { color: themeColors.text }]}>
                                {user ? `${user.first_name} ${user.last_name}` : 'You'}
                            </Text>
                            <Text style={[styles.assignedSub, { color: themeColors.textSecondary }]}>Self-assigned appointment</Text>
                        </View>
                        <Ionicons name="lock-closed-outline" size={14} color={themeColors.textLight} />
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textSecondary }]}>NOTES (OPTIONAL)</Text>
                    <TextInput
                        style={[styles.notesInput, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
                        placeholder="Add any notes, special instructions, or requirements…"
                        placeholderTextColor={themeColors.textLight}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color={colors.textInverse} />
                    ) : (
                        <>
                            <Ionicons name="calendar-outline" size={20} color={colors.textInverse} />
                            <Text style={styles.submitBtnText}>Schedule Appointment</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Pickers */}
            <WorkOrderPickerModal
                visible={showWoPicker}
                onClose={() => setShowWoPicker(false)}
                onSelect={setSelectedWorkOrder}
            />
            <DateTimePickerModal
                visible={showStartPicker}
                value={scheduledStart?.toISOString()}
                title="Start Date & Time"
                onConfirm={handleStartConfirm}
                onClose={() => setShowStartPicker(false)}
            />
            <DateTimePickerModal
                visible={showEndPicker}
                value={scheduledEnd?.toISOString()}
                title="End Date & Time"
                onConfirm={setScheduledEnd}
                onClose={() => setShowEndPicker(false)}
            />
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    content: {
        padding: spacing.lg,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    navTitle: {
        ...typography.h3,
        color: colors.text,
        flex: 1,
        textAlign: 'center',
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        ...typography.label,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    // Work order selector
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1.5,
        borderColor: ACCENT,
    },
    selectRowEmpty: {
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    selectIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: ACCENT + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectInfo: { flex: 1 },
    selectMain: { ...typography.label, color: ACCENT },
    selectSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    selectPlaceholder: { ...typography.body, color: colors.textLight, flex: 1 },
    // Time card
    card: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
    },
    timeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeInfo: { flex: 1 },
    timeLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
    timeValue: { ...typography.label, color: colors.text, marginTop: 2 },
    timePlaceholder: { ...typography.body, color: colors.textLight, marginTop: 2, fontStyle: 'italic' },
    timeDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.lg },
    durationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: ACCENT + '08',
        borderTopWidth: 1,
        borderTopColor: colors.divider,
    },
    durationText: { ...typography.caption, color: colors.textSecondary },
    // Assigned
    assignedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    assignedAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignedAvatarText: { ...typography.label, color: colors.textInverse },
    assignedInfo: { flex: 1 },
    assignedName: { ...typography.label, color: colors.text },
    assignedSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    // Notes
    notesInput: {
        backgroundColor: '#F8F9FB',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: spacing.lg,
        ...typography.body,
        color: colors.text,
        minHeight: 100,
    },
    // Submit
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: ACCENT,
        borderRadius: 10,
        paddingVertical: spacing.lg,
        marginTop: spacing.md,
        height: 52,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { ...typography.button, color: colors.textInverse },
});
