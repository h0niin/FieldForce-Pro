import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAllServiceAgreements } from '@/hooks/use-service-agreements';
import { workOrdersApi } from '@/api/endpoints';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
const ACCENT = '#4F6BF6';
import { formatDateTime } from '@/utils/format';
import { goBack } from '@/utils/navigation';
import type { ServiceAgreement } from '@/types/models';

export default function AppointmentAgreementsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { work_order_id } = useLocalSearchParams<{ work_order_id: string }>();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const [contactId, setContactId] = useState<string | null>(null);
    const [loadingContact, setLoadingContact] = useState(true);

    const { data: allAgreements, isLoading: loadingAgreements } = useAllServiceAgreements();

    useEffect(() => {
        if (work_order_id) {
            workOrdersApi.getById(work_order_id)
                .then(res => {
                    setContactId(res.data.data?.contact_id ?? null);
                })
                .finally(() => setLoadingContact(false));
        } else {
            setLoadingContact(false);
        }
    }, [work_order_id]);

    const activeCustomerAgreements = allAgreements?.filter(
        (a: ServiceAgreement) => a.contact_id === contactId && a.status === 'active'
    ) ?? [];

    const isLoading = loadingContact || loadingAgreements;

    const renderAgreement = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push(`/agreements/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.agreementName, { color: themeColors.text }]}>{item.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.type.toUpperCase()}</Text>
                </View>
            </View>
            <Text style={[styles.dates, { color: themeColors.textSecondary }]}>
                Valid: {formatDateTime(item.start_date).split(',')[0]} - {formatDateTime(item.end_date).split(',')[0]}
            </Text>
            {item.sla_resolution_hours && (
                <Text style={styles.slaText}>
                    SLA Resolution: {item.sla_resolution_hours}h
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => goBack()}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Customer Agreements</Text>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : activeCustomerAgreements.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="shield-outline" size={48} color={themeColors.textLight} />
                    <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No active agreements found for this customer.</Text>
                </View>
            ) : (
                <FlatList
                    data={activeCustomerAgreements}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAgreement}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.lg }]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        marginRight: spacing.md,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    listContent: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    agreementName: {
        ...typography.h4,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm,
    },
    badge: {
        backgroundColor: ACCENT + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    badgeText: {
        ...typography.caption,
        color: ACCENT,
        fontWeight: '700',
    },
    dates: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    slaText: {
        ...typography.bodySmall,
        color: colors.warning,
        fontWeight: '600',
    },
});
