import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
    TextInput, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { reviewsApi } from '@/api/endpoints';

type Platform = 'internal' | 'google' | 'yelp';

const PLATFORMS: { key: Platform; label: string; icon: any; color: string }[] = [
    { key: 'internal', label: 'Private', icon: 'lock-closed-outline', color: colors.primary },
    { key: 'google', label: 'Google', icon: 'logo-google', color: '#EA4335' },
    { key: 'yelp', label: 'Yelp', icon: 'star-outline', color: '#D32323' },
];

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

export default function ReviewSubmitScreen() {
    const router = useRouter();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
    const params = useLocalSearchParams<{ workOrderId: string; contactId: string }>();

    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [platform, setPlatform] = useState<Platform>('internal');
    const [submitting, setSubmitting] = useState(false);

    const displayRating = hovered || rating;

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }
        setSubmitting(true);
        try {
            await reviewsApi.create({
                work_order_id: params.workOrderId,
                ...(params.contactId ? { contact_id: params.contactId } : {}),
                rating,
                comment: comment.trim() || undefined,
                platform,
            });
            router.replace({
                pathname: '/review-confirm' as any,
                params: { rating: String(rating) },
            });
        } catch (err: any) {
            const msg = err?.response?.data?.message
                ?? err?.response?.data?.error
                ?? err?.message
                ?? 'Please try again.';
            Alert.alert('Submission Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header row */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={themeColors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Rate Your Experience</Text>
                        <View style={{ width: 36 }} />
                    </View>

                    {/* Star selector */}
                    <View style={[styles.starSection, { backgroundColor: themeColors.surface, borderColor }]}>
                        <Text style={[styles.starPrompt, { color: themeColors.textSecondary }]}>
                            {displayRating ? STAR_LABELS[displayRating] : 'Tap a star to rate'}
                        </Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setRating(i)}
                                    activeOpacity={0.7}
                                    style={styles.starBtn}
                                >
                                    <Ionicons
                                        name={i <= displayRating ? 'star' : 'star-outline'}
                                        size={48}
                                        color={i <= displayRating ? '#F59E0B' : themeColors.borderLight}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        {displayRating > 0 && (
                            <Text style={styles.ratingNum}>{displayRating} / 5</Text>
                        )}
                    </View>

                    {/* Comment input */}
                    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor }]}>
                        <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>Tell us more (optional)</Text>
                        <TextInput
                            style={[styles.textInput, { color: themeColors.text, backgroundColor: inputBg, borderColor: themeColors.borderLight }]}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="What did you think of our service?"
                            placeholderTextColor={themeColors.textLight}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={[styles.charCount, { color: themeColors.textLight }]}>{comment.length}/500</Text>
                    </View>

                    {/* Platform selector */}
                    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor }]}>
                        <Text style={[styles.cardLabel, { color: themeColors.textSecondary }]}>Post review to</Text>
                        <View style={styles.platformRow}>
                            {PLATFORMS.map(p => (
                                <TouchableOpacity
                                    key={p.key}
                                    style={[
                                        styles.platformPill,
                                        { borderColor: themeColors.borderLight, backgroundColor: inputBg },
                                        platform === p.key && { backgroundColor: p.color, borderColor: p.color },
                                    ]}
                                    onPress={() => setPlatform(p.key)}
                                >
                                    <Ionicons
                                        name={p.icon}
                                        size={16}
                                        color={platform === p.key ? '#fff' : themeColors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.platformText,
                                        { color: themeColors.textSecondary },
                                        platform === p.key && { color: '#fff' },
                                    ]}>
                                        {p.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, { borderColor }, rating === 0 && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting || rating === 0}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#fff" />
                                <Text style={styles.submitText}>Submit Review</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={[styles.privacyNote, { color: themeColors.textLight }]}>
                        Your review helps us improve our service quality. Thank you!
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: {
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['2xl'],
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.lg,
    },
    backBtn: { padding: spacing.xs },
    headerTitle: { ...typography.h3, color: colors.text },
    starSection: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        paddingVertical: spacing['2xl'],
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    starPrompt: {
        ...typography.h4,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        minHeight: 24,
    },
    starsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    starBtn: { padding: spacing.xs },
    ratingNum: {
        ...typography.caption,
        color: '#F59E0B',
        fontWeight: '700',
        marginTop: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    cardLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textInput: {
        ...typography.body,
        color: colors.text,
        minHeight: 100,
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    charCount: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    platformRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    platformPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
        backgroundColor: colors.background,
        flex: 1,
        justifyContent: 'center',
    },
    platformText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    submitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    submitBtnDisabled: {
        opacity: 0.4,
    },
    submitText: {
        ...typography.button,
        color: '#fff',
        fontSize: 16,
    },
    privacyNote: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
    },
});
