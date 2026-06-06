import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { workOrdersApi, appointmentsApi } from '@/api/endpoints';
import { Appointment, WorkOrder } from '@/types/models';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAuthStore } from '@/store/auth.store';
import { usePermission } from '@/hooks/usePermission';
import { useFocusEffect } from 'expo-router';

const ACCENT = '#4F6BF6';

function isToday(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    );
}

function isThisWeek(dateStr: string | null): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return d >= startOfWeek && d < endOfWeek;
}

// ── Mini bar chart ─────────────────────────────────────────────────────────

function MiniBarChart({ data, barColor, themeColors, borderColor: themeBorderColor }: { data: { label: string; value: number }[]; barColor: string; themeColors?: { text: string; textSecondary: string; borderLight: string }; borderColor?: string }) {
    const max = Math.max(...data.map(d => d.value), 1);

    return (
        <View style={chartStyles.container}>
            {data.map((item, i) => (
                <View key={i} style={chartStyles.barCol}>
                    <Text style={[chartStyles.barValue, themeColors && { color: themeColors.text }]}>{item.value}</Text>
                    <View style={[chartStyles.barTrack, themeColors && { backgroundColor: themeColors.borderLight }]}>
                        <View style={[chartStyles.barFill, {
                            height: `${Math.max((item.value / max) * 100, 4)}%`,
                            backgroundColor: barColor,
                        }]} />
                    </View>
                    <Text style={[chartStyles.barLabel, themeColors && { color: themeColors.textSecondary }]}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

const chartStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
        gap: spacing.xs,
    },
    barCol: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    barValue: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.text,
    },
    barTrack: {
        flex: 1,
        width: '70%',
        backgroundColor: colors.borderLight,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        borderRadius: 4,
    },
    barLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 10,
    },
});

// ── Status dot list ────────────────────────────────────────────────────────

function StatusRow({ label, count, color, themeColors }: { label: string; count: number; color: string; themeColors?: { text: string } }) {
    return (
        <View style={statusStyles.row}>
            <View style={statusStyles.left}>
                <View style={[statusStyles.dot, { backgroundColor: color }]} />
                <Text style={[statusStyles.label, themeColors && { color: themeColors.text }]}>{label}</Text>
            </View>
            <Text style={[statusStyles.count, themeColors && { color: themeColors.text }]}>{count}</Text>
        </View>
    );
}

const statusStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    label: {
        ...typography.body,
        color: colors.text,
    },
    count: {
        ...typography.h4,
        color: colors.text,
    },
});

// ── Main Screen ────────────────────────────────────────────────────────────

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
    const user = useAuthStore(s => s.user);
    const { can, isTechnician } = usePermission();

    const hasWorkOrderAccess = can('work_orders:read');
    const hasAppointmentAccess = can('service_appointments:read');
    const hasDashboardAccess = hasWorkOrderAccess || hasAppointmentAccess;

    const firstName = user?.first_name
        ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)
        : 'User';

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!hasDashboardAccess) {
            setLoading(false);
            return;
        }

        try {
            const [aptRes, woRes] = await Promise.all([
                hasAppointmentAccess
                    ? (isTechnician ? appointmentsApi.getMyAppointments({ take: 200 }) : appointmentsApi.getAll({ take: 200 }))
                    : Promise.resolve({ data: { data: [] as Appointment[] } }),
                hasWorkOrderAccess
                    ? (isTechnician ? workOrdersApi.getMyWorkOrders({ take: 200 }) : workOrdersApi.getAll({ take: 200 }))
                    : Promise.resolve({ data: { data: [] as WorkOrder[] } })
            ]);
            setAppointments(aptRes.data?.data ?? []);
            setWorkOrders(woRes.data?.data ?? []);
        } catch (error) {
            console.error('Failed to fetch dashboard metrics:', error);
        } finally {
            setLoading(false);
        }
    }, [hasWorkOrderAccess, hasAppointmentAccess, hasDashboardAccess, isTechnician]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // ── Derived metrics ────────────────────────────────────────────────────
    const metrics = useMemo(() => {
        let todayAppts = 0;
        let completedAppts = 0;
        let weekAppts = 0;
        let weekCompleted = 0;

        const aptStatusCounts: Record<string, number> = {};

        appointments.forEach(apt => {
            aptStatusCounts[apt.status] = (aptStatusCounts[apt.status] || 0) + 1;
            if (isToday(apt.scheduled_start)) {
                todayAppts++;
                if (apt.status === 'completed') completedAppts++;
            }
            if (isThisWeek(apt.scheduled_start)) {
                weekAppts++;
                if (apt.status === 'completed') weekCompleted++;
            }
        });

        let openWOs = 0;
        let inProgressWOs = 0;
        let completedWOs = 0;
        let onHoldWOs = 0;

        const woPriorityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };

        workOrders.forEach(wo => {
            if (wo.status === 'completed') completedWOs++;
            else if (wo.status === 'in_progress') inProgressWOs++;
            else if (wo.status === 'on_hold') onHoldWOs++;
            else if (wo.status !== 'cancelled') openWOs++;

            if (wo.priority && wo.status !== 'completed' && wo.status !== 'cancelled') {
                woPriorityCounts[wo.priority] = (woPriorityCounts[wo.priority] || 0) + 1;
            }
        });

        return {
            todayAppts,
            completedAppts,
            weekAppts,
            weekCompleted,
            aptStatusCounts,
            openWOs,
            inProgressWOs,
            completedWOs,
            onHoldWOs,
            totalWOs: workOrders.length,
            woPriorityCounts,
        };
    }, [appointments, workOrders]);

    // Completion rate
    const todayPct = metrics.todayAppts > 0
        ? Math.round((metrics.completedAppts / metrics.todayAppts) * 100)
        : 0;
    const weekPct = metrics.weekAppts > 0
        ? Math.round((metrics.weekCompleted / metrics.weekAppts) * 100)
        : 0;

    // Bar chart data for WO status
    const woBarData = [
        { label: 'Open', value: metrics.openWOs },
        { label: 'Active', value: metrics.inProgressWOs },
        { label: 'Hold', value: metrics.onHoldWOs },
        { label: 'Done', value: metrics.completedWOs },
    ];

    return (
        <ScrollView
            contentContainerStyle={[styles.container, {
                paddingTop: insets.top + spacing.lg,
                paddingBottom: insets.bottom + spacing['3xl'],
                backgroundColor: isDark ? themeColors.background : '#F8F9FB',
            }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.primary} />}
        >
            {/* Header */}
            <Text style={[styles.pageTitle, { color: themeColors.text }]}>Metrics</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                {hasDashboardAccess ? 'Your performance overview' : 'Dashboard'}
            </Text>

            {loading ? (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
            ) : !hasDashboardAccess ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="lock-closed-outline" size={48} color={themeColors.textLight} />
                    <Text style={[styles.emptyTitle, { color: themeColors.textSecondary }]}>Access Restricted</Text>
                    <Text style={[styles.emptySubtitle, { color: themeColors.textLight }]}>
                        Your role does not have permission to view field services metrics.
                    </Text>
                </View>
            ) : (
                <>
                    {/* ── Completion summary cards ─────────────────────────── */}
                    {hasAppointmentAccess && (
                        <View style={styles.summaryRow}>
                            <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
                                <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>Today</Text>
                                <Text style={[styles.summaryValue, { color: themeColors.text }]}>{todayPct}%</Text>
                                <View style={[styles.miniTrack, { backgroundColor: themeColors.borderLight }]}>
                                    <View style={[styles.miniFill, { width: `${todayPct}%` }]} />
                                </View>
                                <Text style={[styles.summarySubtext, { color: themeColors.textSecondary }]}>
                                    {metrics.completedAppts}/{metrics.todayAppts} done
                                </Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
                                <Text style={[styles.summaryLabel, { color: themeColors.textSecondary }]}>This Week</Text>
                                <Text style={[styles.summaryValue, { color: themeColors.text }]}>{weekPct}%</Text>
                                <View style={[styles.miniTrack, { backgroundColor: themeColors.borderLight }]}>
                                    <View style={[styles.miniFill, {
                                        width: `${weekPct}%`,
                                        backgroundColor: themeColors.info,
                                    }]} />
                                </View>
                                <Text style={[styles.summarySubtext, { color: themeColors.textSecondary }]}>
                                    {metrics.weekCompleted}/{metrics.weekAppts} done
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ── Appointments breakdown ──────────────────────────── */}
                    {hasAppointmentAccess && (
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: borderColor }]}>
                                <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
                                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Appointments</Text>
                            </View>
                            <StatusRow label="Scheduled" count={metrics.aptStatusCounts['scheduled'] || 0} color={themeColors.statusOpen} themeColors={themeColors} />
                            <StatusRow label="En Route" count={metrics.aptStatusCounts['en_route'] || 0} color={themeColors.statusEnRoute} themeColors={themeColors} />
                            <StatusRow label="On Site" count={metrics.aptStatusCounts['on_site'] || 0} color={themeColors.statusOnSite} themeColors={themeColors} />
                            <StatusRow label="In Progress" count={metrics.aptStatusCounts['in_progress'] || 0} color={themeColors.statusInProgress} themeColors={themeColors} />
                            <StatusRow label="Completed" count={metrics.aptStatusCounts['completed'] || 0} color={themeColors.statusCompleted} themeColors={themeColors} />
                            <StatusRow label="On Hold" count={metrics.aptStatusCounts['on_hold'] || 0} color={themeColors.statusOnHold} themeColors={themeColors} />
                        </View>
                    )}

                    {/* ── Work orders chart ────────────────────────────────── */}
                    {hasWorkOrderAccess && (
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: borderColor }]}>
                                <Ionicons name="briefcase-outline" size={18} color={themeColors.warning} />
                                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Work Orders</Text>
                                <Text style={[styles.cardBadge, { color: themeColors.textSecondary, backgroundColor: themeColors.borderLight }]}>{metrics.totalWOs} total</Text>
                            </View>
                            <MiniBarChart data={woBarData} barColor={themeColors.primary} themeColors={themeColors} />
                        </View>
                    )}

                    {/* ── Priority breakdown ──────────────────────────────── */}
                    {hasWorkOrderAccess && (
                        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                            <View style={[styles.cardHeader, { borderBottomColor: borderColor }]}>
                                <Ionicons name="flag-outline" size={18} color={themeColors.error} />
                                <Text style={[styles.cardTitle, { color: themeColors.text }]}>Active by Priority</Text>
                            </View>
                            <StatusRow label="Urgent" count={metrics.woPriorityCounts.urgent} color={themeColors.priorityUrgent} themeColors={themeColors} />
                            <StatusRow label="High" count={metrics.woPriorityCounts.high} color={themeColors.priorityHigh} themeColors={themeColors} />
                            <StatusRow label="Medium" count={metrics.woPriorityCounts.medium} color={themeColors.priorityMedium} themeColors={themeColors} />
                            <StatusRow label="Low" count={metrics.woPriorityCounts.low} color={themeColors.priorityLow} themeColors={themeColors} />
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.lg,
        backgroundColor: '#F8F9FB',
        minHeight: '100%',
    },
    pageTitle: {
        ...typography.h1,
        color: colors.text,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.xl,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing['4xl'],
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        marginTop: spacing['2xl'],
    },
    emptyTitle: {
        ...typography.h4,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...typography.body,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 22,
    },

    // ── Summary cards ────────────────────────────────────────────────────────
    summaryRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryLabel: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    miniTrack: {
        height: 6,
        backgroundColor: colors.borderLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    miniFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    summarySubtext: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    // ── Cards ────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    cardTitle: {
        ...typography.h4,
        color: colors.text,
        flex: 1,
    },
    cardBadge: {
        ...typography.caption,
        color: colors.textSecondary,
        backgroundColor: colors.borderLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
});
