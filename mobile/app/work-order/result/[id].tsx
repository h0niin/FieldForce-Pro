import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function VerificationResultScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    // Use search params to pass in status, title, message, and details
    const { status = 'success', title = 'Verification Complete', message = '', details = '' } = useLocalSearchParams<{
        status: 'success' | 'error' | 'warning';
        title: string;
        message: string;
        details?: string;
    }>();

    const isSuccess = status === 'success';
    const isError = status === 'error';

    const iconName = isSuccess ? 'checkmark-circle' : isError ? 'close-circle' : 'warning';
    const iconColor = isSuccess ? colors.success : isError ? colors.error : colors.warning;
    const statusHeaderBg = isSuccess ? colors.success + '10' : isError ? colors.error + '10' : colors.warning + '10';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }
                ]}
            >
                <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                    <View style={[styles.iconWrapper, { backgroundColor: statusHeaderBg }]}>
                        <Ionicons name={iconName} size={84} color={iconColor} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}

                    {details ? (
                        <View style={styles.detailsBox}>
                            <Text style={styles.detailsLabel}>Verification Details</Text>
                            <Text style={styles.detailsText}>{details}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={{ flex: 1 }} />

                <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
                    <Text style={styles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        padding: spacing.lg,
    },
    card: {
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: borderRadius.lg,
        marginTop: spacing.xl,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        ...typography.h2,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    detailsBox: {
        width: '100%',
        backgroundColor: colors.background,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    detailsLabel: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    detailsText: {
        ...typography.bodySmall,
        color: colors.text,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        width: '100%',
    },
    primaryButtonText: {
        ...typography.button,
        color: colors.white,
    },
});
