import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ReviewPromptScreen() {
    const router = useRouter();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
    const params = useLocalSearchParams<{
        workOrderId: string;
        contactId: string;
        workOrderNumber?: string;
        technicianName?: string;
        serviceSummary?: string;
    }>();

    const handleLeaveReview = () => {
        router.push({
            pathname: '/review-submit' as any,
            params: {
                workOrderId: params.workOrderId,
                contactId: params.contactId,
            },
        });
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
                <View style={styles.container}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color={themeColors.textSecondary} />
                    </TouchableOpacity>

                    {/* Illustration area */}
                    <View style={styles.illustrationWrap}>
                        <View style={[styles.illustrationCircle, { backgroundColor: themeColors.primary + '15', borderColor }]}>
                            <Ionicons name="shield-checkmark" size={64} color={themeColors.primary} />
                        </View>
                        {/* Star decoration */}
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Ionicons key={i} name="star" size={22} color="#F59E0B" />
                            ))}
                        </View>
                    </View>

                    {/* Copy */}
                    <Text style={[styles.title, { color: themeColors.text }]}>Your Service is Complete!</Text>
                    {params.serviceSummary ? (
                        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{params.serviceSummary}</Text>
                    ) : null}
                    {params.technicianName ? (
                        <View style={[styles.techBadge, { backgroundColor: themeColors.surface, borderColor }]}>
                            <Ionicons name="person-circle-outline" size={20} color={themeColors.primary} />
                            <Text style={styles.techText}>Served by {params.technicianName}</Text>
                        </View>
                    ) : null}
                    {params.workOrderNumber ? (
                        <Text style={[styles.woNumber, { color: themeColors.textLight }]}>Work Order #{params.workOrderNumber}</Text>
                    ) : null}

                    <Text style={[styles.askText, { color: themeColors.textSecondary }]}>
                        We'd love to hear about your experience. Your feedback helps us improve!
                    </Text>

                    {/* CTAs */}
                    <TouchableOpacity style={[styles.primaryBtn, { borderColor }]} onPress={handleLeaveReview}>
                        <Ionicons name="star-outline" size={20} color="#fff" />
                        <Text style={styles.primaryBtnText}>Leave a Review</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
                        <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing['2xl'],
        paddingBottom: spacing['2xl'],
    },
    closeBtn: {
        position: 'absolute',
        top: spacing.xl,
        right: spacing.xl,
        padding: spacing.sm,
    },
    illustrationWrap: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
    },
    illustrationCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    techBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        marginBottom: spacing.sm,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    techText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    woNumber: {
        ...typography.caption,
        color: colors.textLight,
        marginBottom: spacing.xl,
    },
    askText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing['2xl'],
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['2xl'],
        borderRadius: borderRadius.lg,
        width: '100%',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    primaryBtnText: {
        ...typography.button,
        color: '#fff',
        fontSize: 16,
    },
    skipBtn: {
        paddingVertical: spacing.md,
    },
    skipText: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
