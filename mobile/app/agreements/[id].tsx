import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useServiceAgreement } from '@/hooks/use-service-agreements';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime } from '@/utils/format';

const ACCENT = '#4F6BF6';

export default function AgreementDetailScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const { data: agreement, isLoading, isError } = useServiceAgreement(id);

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                <ActivityIndicator size="large" color={ACCENT} />
            </View>
        );
    }

    if (isError || !agreement) {
        return (
            <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                <Ionicons name="alert-circle-outline" size={48} color={themeColors.error} />
                <Text style={[styles.errorText, { color: themeColors.error }]}>Agreement not found</Text>
                <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

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

    return (
        <View style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: themeColors.text }]}>Agreement Details</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
                <View style={[styles.mainCard, { backgroundColor: cardBg, borderColor }]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.name, { color: themeColors.text }]}>{agreement.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(agreement.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(agreement.status) }]}>
                                {agreement.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    {agreement.description && (
                        <Text style={[styles.description, { color: themeColors.textSecondary }]}>{agreement.description}</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Details</Text>
                    <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Type</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>{agreement.type.toUpperCase()}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Value</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>${Number(agreement.value).toFixed(2)}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Start Date</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>{formatDateTime(agreement.start_date).split(',')[0]}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>End Date</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>{formatDateTime(agreement.end_date).split(',')[0]}</Text>
                        </View>
                        {agreement.recurrence && (
                            <>
                                <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Recurrence</Text>
                                    <Text style={[styles.infoValue, { color: themeColors.text }]}>{agreement.recurrence}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>SLA Compliance</Text>
                    <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Response Time</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>
                                {agreement.sla_response_hours ? `${agreement.sla_response_hours} Hours` : 'N/A'}
                            </Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Resolution Time</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>
                                {agreement.sla_resolution_hours ? `${agreement.sla_resolution_hours} Hours` : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
        ...typography.h3,
        color: colors.error,
        textAlign: 'center',
    },
    backButtonLarge: {
        backgroundColor: ACCENT,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
    backButtonText: {
        ...typography.button,
        color: colors.textInverse,
    },
    content: {
        padding: spacing.lg,
        gap: spacing.xl,
    },
    mainCard: {
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
        marginBottom: spacing.xs,
    },
    name: {
        ...typography.h3,
        color: colors.text,
        flex: 1,
        marginRight: spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusText: {
        ...typography.caption,
        fontWeight: '700',
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
    section: {
        gap: spacing.sm,
    },
    sectionTitle: {
        ...typography.label,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.lg,
    },
    infoLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    infoValue: {
        ...typography.body,
        color: colors.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginHorizontal: spacing.lg,
    },
});
