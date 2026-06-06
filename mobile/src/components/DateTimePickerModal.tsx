// src/components/DateTimePickerModal.tsx
// Cross-platform date + time picker — no native modules required.
// Works in Expo Go. Uses ScrollView drum columns.

import { useEffect, useRef, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5; // odd number so the center item is selected
const DRUM_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function daysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
}

function range(start: number, end: number) {
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
}

// ─── Drum column ─────────────────────────────────────────────────────────────

function Drum({
    items,
    selectedIndex,
    onSelect,
    width,
    format,
}: {
    items: (string | number)[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    width: number;
    format?: (v: string | number) => string;
}) {
    const ref = useRef<ScrollView>(null);
    const didMount = useRef(false);

    const scrollTo = (index: number, animated: boolean) => {
        ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
    };

    // Scroll to initial position
    useEffect(() => {
        const t = setTimeout(() => scrollTo(selectedIndex, false), 50);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll when selection changes externally (month→day clamping etc.)
    useEffect(() => {
        if (!didMount.current) { didMount.current = true; return; }
        scrollTo(selectedIndex, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIndex]);

    const handleScroll = (y: number) => {
        const index = Math.round(y / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(items.length - 1, index));
        onSelect(clamped);
    };

    return (
        <View style={[styles.drumWrapper, { width }]}>
            {/* Selection highlight */}
            <View style={styles.selectionBar} pointerEvents="none" />

            <ScrollView
                ref={ref}
                style={{ height: DRUM_HEIGHT }}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
                onScrollEndDrag={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            >
                {items.map((item, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.drumItem}
                        onPress={() => { onSelect(i); scrollTo(i, true); }}
                        activeOpacity={0.6}
                    >
                        <Text
                            style={[
                                styles.drumItemText,
                                i === selectedIndex && styles.drumItemTextSelected,
                            ]}
                        >
                            {format ? format(item) : String(item)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DateTimePickerModalProps {
    visible: boolean;
    /** Initial value as an ISO string, or undefined for "now" */
    value?: string;
    onConfirm: (date: Date) => void;
    onClose: () => void;
    title?: string;
    /** 'datetime' (default) | 'date' — hide time drums when 'date' */
    mode?: 'datetime' | 'date';
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function DateTimePickerModal({
    visible,
    value,
    onConfirm,
    onClose,
    title = 'Select Date & Time',
    mode = 'datetime',
}: DateTimePickerModalProps) {
    const insets = useSafeAreaInsets();

    const init = () => {
        const d = value ? new Date(value) : new Date();
        return {
            monthIndex: d.getMonth(),
            day: d.getDate(),
            year: d.getFullYear(),
            hour12: d.getHours() % 12 || 12,
            minute: d.getMinutes(),
            isPM: d.getHours() >= 12,
        };
    };

    const [monthIndex, setMonthIndex] = useState(0);
    const [day, setDay] = useState(1);
    const [year, setYear] = useState(2026);
    const [hour12, setHour12] = useState(9);
    const [minute, setMinute] = useState(0);
    const [isPM, setIsPM] = useState(false);

    // Reinitialise every time the modal opens
    useEffect(() => {
        if (!visible) return;
        const s = init();
        setMonthIndex(s.monthIndex);
        setDay(s.day);
        setYear(s.year);
        setHour12(s.hour12);
        setMinute(s.minute);
        setIsPM(s.isPM);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // Clamp day when month/year changes
    const maxDay = daysInMonth(monthIndex, year);
    const safeDay = Math.min(day, maxDay);

    const years = range(2020, 2035);
    const days = range(1, maxDay);
    const hours = range(1, 12);
    const minutes = range(0, 59);

    // Preview
    const previewDate = new Date(
        year,
        monthIndex,
        safeDay,
        isPM ? (hour12 % 12) + 12 : hour12 % 12,
        minute,
    );

    const formatted = previewDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...(mode === 'datetime' && { hour: 'numeric', minute: '2-digit', hour12: true }),
    });

    const handleConfirm = () => {
        onConfirm(previewDate);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

            <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
                {/* Handle */}
                <View style={styles.handle} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={handleConfirm} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.confirmText}>Done</Text>
                    </TouchableOpacity>
                </View>

                {/* Live preview */}
                <View style={styles.preview}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={styles.previewText}>{formatted}</Text>
                </View>

                {/* Drums */}
                <View style={styles.drums}>
                    {/* Month */}
                    <Drum
                        items={MONTHS}
                        selectedIndex={monthIndex}
                        onSelect={setMonthIndex}
                        width={70}
                    />

                    {/* Day */}
                    <Drum
                        items={days}
                        selectedIndex={safeDay - 1}
                        onSelect={(i) => setDay(i + 1)}
                        width={46}
                        format={(v) => String(v).padStart(2, '0')}
                    />

                    {/* Year */}
                    <Drum
                        items={years}
                        selectedIndex={years.indexOf(year)}
                        onSelect={(i) => setYear(years[i])}
                        width={64}
                    />

                    {mode === 'datetime' && (
                        <>
                            <View style={styles.separator} />

                            {/* Hour */}
                            <Drum
                                items={hours}
                                selectedIndex={hour12 - 1}
                                onSelect={(i) => setHour12(i + 1)}
                                width={40}
                                format={(v) => String(v).padStart(2, '0')}
                            />

                            {/* Colon */}
                            <Text style={styles.colonText}>:</Text>

                            {/* Minute */}
                            <Drum
                                items={minutes}
                                selectedIndex={minute}
                                onSelect={setMinute}
                                width={40}
                                format={(v) => String(v).padStart(2, '0')}
                            />

                            {/* AM/PM */}
                            <View style={styles.ampmColumn}>
                                {['AM', 'PM'].map((label) => (
                                    <TouchableOpacity
                                        key={label}
                                        style={[
                                            styles.ampmChip,
                                            ((label === 'PM') === isPM) && styles.ampmChipActive,
                                        ]}
                                        onPress={() => setIsPM(label === 'PM')}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.ampmText,
                                                ((label === 'PM') === isPM) && styles.ampmTextActive,
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },

    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingTop: spacing.sm,
    },

    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: 'center',
        marginBottom: spacing.sm,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    title: { ...typography.h4, color: colors.text },
    cancelText: { ...typography.body, color: colors.textSecondary },
    confirmText: { ...typography.body, color: colors.primary, fontWeight: '700' },

    preview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary + '10',
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
    },
    previewText: { ...typography.body, color: colors.primary, fontWeight: '600', flex: 1 },

    // ── Drums ────────────────────────────────────────────────────────────────
    drums: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },

    drumWrapper: {
        overflow: 'hidden',
        position: 'relative',
    },

    selectionBar: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: colors.primary + '14',
        borderRadius: borderRadius.sm,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.primary + '30',
        zIndex: 1,
    },

    drumItem: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drumItemText: {
        ...typography.body,
        color: colors.textLight,
        fontSize: 17,
    },
    drumItemTextSelected: {
        color: colors.text,
        fontWeight: '700',
        fontSize: 18,
    },

    separator: {
        width: 10,
        height: ITEM_HEIGHT,
    },

    colonText: {
        ...typography.h3,
        color: colors.text,
        marginBottom: 2,
        paddingHorizontal: 2,
    },

    ampmColumn: {
        gap: spacing.sm,
        marginLeft: spacing.sm,
        justifyContent: 'center',
    },
    ampmChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ampmChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    ampmText: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
    ampmTextActive: { color: '#fff' },
});
