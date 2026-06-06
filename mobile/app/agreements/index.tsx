import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAllServiceAgreements } from '@/hooks/use-service-agreements';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime } from '@/utils/format';
import type { ServiceAgreement } from '@/types/models';

const ACCENT = '#4F6BF6';

export default function AgreementsListScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const { data: agreements, isLoading, isError } = useAllServiceAgreements();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return colors.success;
            case 'expired':
                return colors.error;
            case 'renewed':
                return colors.info;
            default:
                return colors.textLight;
        }
    };

    const renderAgreement = ({ item }: { item: ServiceAgreement }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push(`/agreements/${item.id}` as any)}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.name, { color: themeColors.text }]} numberOfLines={1}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={themeColors.textSecondary} />
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>
                        Valid: {formatDateTime(item.start_date).split(',')[0]} - {formatDateTime(item.end_date).split(',')[0]}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="pricetag-outline" size={16} color={themeColors.textSecondary} />
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>Type: {item.type.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={themeColors.textSecondary} />
                    <Text style={[styles.detailText, { color: themeColors.textSecondary }]}>Value: ${Number(item.value).toFixed(2)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Service Agreements</Text>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : isError ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color={themeColors.error} />
                    <Text style={[styles.errorText, { color: themeColors.error }]}>Failed to load agreements.</Text>
                </View>
            ) : agreements?.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="shield-outline" size={48} color={themeColors.textLight} />
                    <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No service agreements found.</Text>
                </View>
            ) : (
                <FlatList
                    data={agreements}
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.md,
    },
    errorText: {
        ...typography.body,
        color: colors.error,
        textAlign: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
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
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    name: {
        ...typography.h4,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusText: {
        ...typography.caption,
        fontWeight: '700',
    },
    cardDetails: {
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    detailText: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
