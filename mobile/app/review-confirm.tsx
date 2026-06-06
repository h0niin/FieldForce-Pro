import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ReviewConfirmScreen() {
    const router = useRouter();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
    const params = useLocalSearchParams<{ rating?: string }>();
    const rating = parseInt(params.rating ?? '5', 10);

    // Pop-in animation
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(100),
            Animated.parallel([
                Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const ratingMessage = (r: number) => {
        if (r >= 5) return 'We\'re thrilled you loved our service!';
        if (r >= 4) return 'Thanks for the great feedback!';
        if (r >= 3) return 'We appreciate your honest feedback.';
        return 'We\'re sorry we didn\'t meet your expectations. We\'ll do better.';
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
                <View style={styles.container}>
                    {/* Animated checkmark */}
                    <Animated.View style={[styles.checkCircle, { opacity, transform: [{ scale }], borderColor }]}>
                        <Ionicons name="checkmark" size={56} color="#fff" />
                    </Animated.View>

                    <Animated.View style={{ opacity, alignItems: 'center' }}>
                        <Text style={[styles.thankYou, { color: themeColors.text }]}>Thank You!</Text>
                        <Text style={[styles.message, { color: themeColors.textSecondary }]}>{ratingMessage(rating)}</Text>

                        {/* Echo the submitted stars */}
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <Ionicons
                                    key={i}
                                    name={i <= rating ? 'star' : 'star-outline'}
                                    size={28}
                                    color={i <= rating ? '#F59E0B' : themeColors.borderLight}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingLabel}>You gave us {rating}/5 stars</Text>

                        <View style={[styles.divider, { backgroundColor: themeColors.borderLight }]} />

                        <Text style={[styles.caption, { color: themeColors.textLight }]}>
                            Your review has been submitted and will help us serve you better next time.
                        </Text>
                    </Animated.View>

                    <TouchableOpacity style={[styles.doneBtn, { borderColor }]} onPress={() => router.dismissAll()}>
                        <Text style={styles.doneBtnText}>Done</Text>
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
        gap: spacing.lg,
    },
    checkCircle: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    thankYou: {
        ...typography.h1,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: spacing.sm,
    },
    ratingLabel: {
        ...typography.caption,
        color: '#F59E0B',
        fontWeight: '700',
    },
    divider: {
        width: 60,
        height: 2,
        backgroundColor: colors.borderLight,
        borderRadius: 1,
        marginVertical: spacing.lg,
    },
    caption: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 18,
    },
    doneBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['2xl'] * 2,
        borderRadius: borderRadius.lg,
        borderWidth: 1, borderColor: '#E2E8F0',
        marginTop: spacing.lg,
    },
    doneBtnText: {
        ...typography.button,
        color: '#fff',
        fontSize: 16,
    },
});
