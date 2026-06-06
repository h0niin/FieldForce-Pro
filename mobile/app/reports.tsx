import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { reportsApi } from '@/api/endpoints';

const ACCENT = '#4F6BF6';

type ReportType = 'work-orders' | 'invoices' | 'timesheets' | 'performance';

const TABS: { key: ReportType; label: string; icon: any }[] = [
    { key: 'work-orders', label: 'Work Orders', icon: 'briefcase-outline' },
    { key: 'invoices', label: 'Invoices', icon: 'receipt-outline' },
    { key: 'timesheets', label: 'Timesheets', icon: 'time-outline' },
    { key: 'performance', label: 'Performance', icon: 'trending-up-outline' },
];

const { width } = Dimensions.get('window');

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) => {
    const { colors: tc, isDark, cardBg, borderColor: bc } = useAppTheme();
    return (
        <View style={[statCardStyles.card, { borderLeftColor: color, backgroundColor: cardBg, borderColor: bc }]}>
            <View style={[statCardStyles.iconWrap, { backgroundColor: color + '18' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={statCardStyles.textWrap}>
                <Text style={[statCardStyles.label, { color: tc.textSecondary }]}>{label}</Text>
                <Text style={[statCardStyles.value, { color }]}>{value}</Text>
                {sub ? <Text style={[statCardStyles.sub, { color: tc.textLight }]}>{sub}</Text> : null}
            </View>
        </View>
    );
};

const statCardStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: '#FFF',
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: spacing.md,
    },
    iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    textWrap: { flex: 1 },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
    value: { fontSize: 22, fontWeight: '700' },
    sub: { ...typography.caption, color: colors.textLight, marginTop: 1 },
});

const SectionHeader = ({ title }: { title: string }) => {
    const { colors: tc } = useAppTheme();
    return <Text style={[sectionStyles.title, { color: tc.text }]}>{title}</Text>;
};
const sectionStyles = StyleSheet.create({
    title: { ...typography.h4, color: colors.text, marginBottom: spacing.md, marginTop: spacing.lg },
});

const StatusBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => {
    const { colors: tc, isDark, borderColor: bc } = useAppTheme();
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <View style={barStyles.row}>
            <View style={barStyles.labelRow}>
                <Text style={[barStyles.label, { color: tc.textSecondary }]}>{label}</Text>
                <Text style={[barStyles.count, { color: tc.text }]}>{count} <Text style={[barStyles.pct, { color: tc.textLight }]}>({pct}%)</Text></Text>
            </View>
            <View style={[barStyles.track, { backgroundColor: bc }]}>
                <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
            </View>
        </View>
    );
};
const barStyles = StyleSheet.create({
    row: { marginBottom: spacing.md },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { ...typography.body, color: colors.textSecondary, textTransform: 'capitalize' },
    count: { ...typography.body, color: colors.text, fontWeight: '600' },
    pct: { ...typography.caption, color: colors.textLight, fontWeight: '400' },
    track: { height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
});

// ─── Tab Renderers ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    new: colors.info,
    estimated: '#8B5CF6',
    approved: '#06B6D4',
    scheduled: '#F59E0B',
    in_progress: colors.primary,
    on_hold: '#F97316',
    completed: colors.success,
    closed: colors.textLight,
    cancelled: colors.error,
    draft: colors.textLight,
    sent: colors.info,
    viewed: '#8B5CF6',
    partially_paid: '#F59E0B',
    paid: colors.success,
    overdue: colors.error,
    void: colors.textLight,
    pending: '#F59E0B',
    rejected: colors.error,
};
const PRIORITY_COLORS: Record<string, string> = {
    low: colors.success,
    medium: '#F59E0B',
    high: '#F97316',
    urgent: colors.error,
};

const WorkOrdersView = ({ data }: { data: any }) => {
    const { colors: tc, cardBg, borderColor: bc } = useAppTheme();
    const total = data.total_work_orders ?? 0;
    const byStatus: Record<string, number> = data.by_status ?? {};
    const byPriority: Record<string, number> = data.by_priority ?? {};
    return (
        <ScrollView contentContainerStyle={viewStyles.content} showsVerticalScrollIndicator={false}>
            <View style={viewStyles.statRow}>
                <StatCard icon="briefcase" label="Total Work Orders" value={total} color={tc.primary} />
                <StatCard icon="checkmark-circle" label="Avg Completion" value={`${data.average_completion_time_hours ?? 0}h`} color={tc.success} sub="per work order" />
            </View>

            <SectionHeader title="By Status" />
            <View style={[viewStyles.barSection, { backgroundColor: cardBg, borderColor: bc }]}>
                {Object.entries(byStatus).map(([status, cnt]) => (
                    <StatusBar key={status} label={status.replace(/_/g, ' ')} count={cnt as number} total={total} color={STATUS_COLORS[status] ?? tc.primary} />
                ))}
            </View>

            <SectionHeader title="By Priority" />
            <View style={[viewStyles.barSection, { backgroundColor: cardBg, borderColor: bc }]}>
                {Object.entries(byPriority).map(([priority, cnt]) => (
                    <StatusBar key={priority} label={priority} count={cnt as number} total={total} color={PRIORITY_COLORS[priority] ?? tc.primary} />
                ))}
            </View>
        </ScrollView>
    );
};

const InvoicesView = ({ data }: { data: any }) => {
    const { colors: tc, cardBg, borderColor: bc } = useAppTheme();
    const total = data.total_invoices ?? 0;
    const revenue = data.total_revenue ?? 0;
    const avg = data.average_invoice_amount ?? 0;
    const rate = data.collection_rate ?? 0;
    const byStatus: Record<string, number> = data.by_status ?? {};
    return (
        <ScrollView contentContainerStyle={viewStyles.content} showsVerticalScrollIndicator={false}>
            <View style={viewStyles.statRow}>
                <StatCard icon="receipt" label="Total Invoices" value={total} color={tc.primary} />
                <StatCard icon="cash" label="Total Revenue" value={`$${Number(revenue).toLocaleString()}`} color={tc.success} />
            </View>
            <View style={viewStyles.statRow}>
                <StatCard icon="calculator" label="Avg Invoice" value={`$${Number(avg).toLocaleString()}`} color="#8B5CF6" />
                <StatCard icon="pie-chart" label="Collection Rate" value={`${rate}%`} color={rate >= 70 ? tc.success : tc.warning} sub="paid / total invoiced" />
            </View>

            <SectionHeader title="By Status" />
            <View style={[viewStyles.barSection, { backgroundColor: cardBg, borderColor: bc }]}>
                {Object.entries(byStatus).map(([status, cnt]) => (
                    <StatusBar key={status} label={status.replace(/_/g, ' ')} count={cnt as number} total={total} color={STATUS_COLORS[status] ?? tc.primary} />
                ))}
            </View>
        </ScrollView>
    );
};

const TimesheetsView = ({ data }: { data: any }) => {
    const { colors: tc, cardBg, borderColor: bc } = useAppTheme();
    const totalHours = data.total_hours ?? 0;
    const entries = data.total_entries ?? 0;
    const avgPerDay = data.average_hours_per_day ?? 0;
    const byTech: any[] = data.by_technician ?? [];
    return (
        <ScrollView contentContainerStyle={viewStyles.content} showsVerticalScrollIndicator={false}>
            <View style={viewStyles.statRow}>
                <StatCard icon="time" label="Total Hours" value={`${totalHours}h`} color={tc.primary} />
                <StatCard icon="document-text" label="Total Entries" value={entries} color="#8B5CF6" />
            </View>
            <StatCard icon="trending-up" label="Avg Hours/Day" value={`${avgPerDay}h`} color={tc.success} sub="over selected period" />

            {byTech.length > 0 && (
                <>
                    <SectionHeader title="By Technician" />
                    {byTech.map((t, i) => (
                        <View key={t.user_id ?? i} style={[techStyles.row, { backgroundColor: cardBg, borderColor: bc }]}>
                            <View style={[techStyles.avatar, { backgroundColor: tc.primary + '15' }]}>
                                <Ionicons name="person" size={18} color={tc.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[techStyles.id, { color: tc.text }]} numberOfLines={1}>{t.user_id ?? `Tech #${i + 1}`}</Text>
                                <Text style={[techStyles.sub, { color: tc.textSecondary }]}>{t.entries ?? 0} entries</Text>
                            </View>
                            <Text style={[techStyles.hours, { color: tc.primary }]}>{t.hours ?? 0}h</Text>
                        </View>
                    ))}
                </>
            )}
        </ScrollView>
    );
};

const techStyles = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        backgroundColor: '#FFF', borderRadius: borderRadius.md,
        padding: spacing.md, marginBottom: spacing.sm,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    id: { ...typography.body, color: colors.text, fontWeight: '600', maxWidth: width - 180 },
    sub: { ...typography.caption, color: colors.textSecondary },
    hours: { fontSize: 16, fontWeight: '700', color: colors.primary },
});

const PerformanceView = ({ data }: { data: any }) => {
    const { colors: tc, cardBg, borderColor: bc } = useAppTheme();
    const fixRate = data.first_time_fix_rate ?? 0;
    const responseTime = data.average_response_time_hours ?? 0;
    const resolutionTime = data.average_resolution_time_hours ?? 0;
    const utilization = data.technician_utilization_rate ?? 0;
    const topPerformers: any[] = data.top_performers ?? [];

    const rateColor = fixRate >= 80 ? tc.success : fixRate >= 60 ? tc.warning : tc.error;
    return (
        <ScrollView contentContainerStyle={viewStyles.content} showsVerticalScrollIndicator={false}>
            {/* Fix Rate circle badge */}
            <View style={perfStyles.fixRateCard}>
                <View style={[perfStyles.circle, { borderColor: rateColor, backgroundColor: cardBg }]}>
                    <Text style={[perfStyles.circleNum, { color: rateColor }]}>{fixRate}%</Text>
                    <Text style={[perfStyles.circleLabel, { color: tc.textSecondary }]}>Fix Rate</Text>
                </View>
                <View style={{ flex: 1, gap: spacing.sm }}>
                    <StatCard icon="alarm" label="Avg Response Time" value={`${responseTime}h`} color={tc.info} />
                    <StatCard icon="hourglass" label="Avg Resolution" value={`${resolutionTime}h`} color="#8B5CF6" />
                </View>
            </View>

            <StatCard icon="people" label="Technician Utilization" value={`${utilization} jobs/tech`} color={tc.primary} sub="avg appointments per technician" />

            {topPerformers.length > 0 && (
                <>
                    <SectionHeader title="Top Performers" />
                    {topPerformers.map((p, i) => (
                        <View key={p.user_id ?? i} style={[techStyles.row, { backgroundColor: cardBg, borderColor: bc }]}>
                            <View style={[techStyles.avatar, { backgroundColor: i === 0 ? '#F59E0B20' : tc.primary + '15' }]}>
                                <Ionicons name={i === 0 ? 'trophy' : 'person'} size={18} color={i === 0 ? '#F59E0B' : tc.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[techStyles.id, { color: tc.text }]} numberOfLines={1}>{p.user_id ?? `Tech #${i + 1}`}</Text>
                                <Text style={[techStyles.sub, { color: tc.textSecondary }]}>Rank #{i + 1}</Text>
                            </View>
                            <Text style={[techStyles.hours, { color: i === 0 ? '#F59E0B' : tc.primary }]}>
                                {p.appointments ?? 0} <Text style={{ fontSize: 12, fontWeight: '400' }}>appts</Text>
                            </Text>
                        </View>
                    ))}
                </>
            )}
        </ScrollView>
    );
};

const perfStyles = StyleSheet.create({
    fixRateCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginBottom: spacing.md },
    circle: {
        width: 100, height: 100, borderRadius: 50, borderWidth: 4,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    circleNum: { fontSize: 22, fontWeight: '700' },
    circleLabel: { ...typography.caption, color: colors.textSecondary },
});

const viewStyles = StyleSheet.create({
    content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
    statRow: { flexDirection: 'row', gap: spacing.md },
    barSection: {
        backgroundColor: '#FFF', borderRadius: borderRadius.md,
        padding: spacing.lg, marginBottom: spacing.md,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const [activeTab, setActiveTab] = useState<ReportType>('work-orders');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReport();
    }, [activeTab]);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        setReportData(null);
        try {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            const params = {
                start_date: start.toISOString().split('T')[0],
                end_date: end.toISOString().split('T')[0],
            };
            let res: any;
            switch (activeTab) {
                case 'work-orders': res = await reportsApi.getWorkOrderReport(params); break;
                case 'invoices': res = await reportsApi.getInvoiceReport(params); break;
                case 'timesheets': res = await reportsApi.getTimesheetReport(params); break;
                case 'performance': res = await reportsApi.getPerformanceReport(params); break;
            }
            setReportData(res?.data?.data ?? res?.data);
        } catch (err: any) {
            setError(err?.message ?? 'Failed to load report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={ACCENT} />
                    <Text style={[styles.centerText, { color: themeColors.textSecondary }]}>Loading report…</Text>
                </View>
            );
        }
        if (error) {
            return (
                <View style={styles.center}>
                    <Ionicons name="warning-outline" size={52} color={themeColors.error} />
                    <Text style={[styles.centerText, { color: themeColors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (!reportData) {
            return (
                <View style={styles.center}>
                    <Ionicons name="document-outline" size={52} color={themeColors.textLight} />
                    <Text style={[styles.centerText, { color: themeColors.textSecondary }]}>No data available for this period.</Text>
                </View>
            );
        }
        switch (activeTab) {
            case 'work-orders': return <WorkOrdersView data={reportData} />;
            case 'invoices': return <InvoicesView data={reportData} />;
            case 'timesheets': return <TimesheetsView data={reportData} />;
            case 'performance': return <PerformanceView data={reportData} />;
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? themeColors.surface : '#F1F5F9' }]}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>System Reports</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={[styles.tabsWrapper, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, { borderColor: borderColor, backgroundColor: isDark ? themeColors.surface : '#F8F9FB' }, activeTab === tab.key && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Ionicons
                                    name={tab.icon}
                                    size={14}
                                    color={activeTab === tab.key ? '#fff' : themeColors.textSecondary}
                                />
                                <Text style={[styles.tabText, { color: themeColors.textSecondary }, activeTab === tab.key && styles.activeTabText]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {renderContent()}
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { ...typography.h3, color: colors.text, textAlign: 'center', flex: 1 },
    tabsWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    tabsContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.full, borderWidth: 1, borderColor: '#E2E8F0',
        backgroundColor: '#F8F9FB',
    },
    activeTab: { backgroundColor: ACCENT, borderColor: ACCENT },
    tabText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    activeTabText: { color: '#fff' },
    content: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing['2xl'] },
    centerText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, backgroundColor: ACCENT, borderRadius: borderRadius.md },
    retryBtnText: { ...typography.button, color: '#fff' },
});
