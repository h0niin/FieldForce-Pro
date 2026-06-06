import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { database } from '@/db/database';
import type { Pricebook } from '@/db/models';
import withObservables from '@nozbe/with-observables';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

interface PricebookScreenProps {
    pricebooks: Pricebook[];
}

const TIER_ORDER = ['good', 'better', 'best'];

const TIER_COLORS = {
    good: { bg: '#E2E8F0', border: '#CBD5E1', text: '#334155' },
    better: { bg: '#DBEAFE', border: '#93C5FD', text: '#2563EB' },
    best: { bg: '#FEF3C7', border: '#FCD34D', text: '#D97706' },
};

function PricebookPresentationScreen({ pricebooks }: PricebookScreenProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    // Group pricebooks by Service category/name
    const groupedOptions = useMemo(() => {
        const groups: Record<string, Pricebook[]> = {};
        pricebooks.forEach((item) => {
            // In a full implementation, you'd likely join with actual services.
            // We group by "name" logic here assuming consistent names.
            const rawName = item.name.replace(/(Good|Better|Best)/ig, '').trim() || 'Service Package';
            if (!groups[rawName]) {
                groups[rawName] = [];
            }
            groups[rawName].push(item);
        });

        // Sort items within each group
        Object.keys(groups).forEach((key) => {
            groups[key].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
        });

        return groups;
    }, [pricebooks]);

    const hasOptions = Object.keys(groupedOptions).length > 0;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDark ? themeColors.surface : '#F1F5F9' }]} onPress={() => router.back()}>
                        <Ionicons name="close" size={28} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Select Package</Text>
                    <View style={{ width: 28 }} />
                </View>
                <Text style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}>
                    We offer clear, transparent pricing options to suit your needs.
                </Text>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['2xl'] }]}>
                {!hasOptions ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color={themeColors.textLight} />
                        <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No pricing options currently available.</Text>
                        <Text style={[styles.emptySubText, { color: themeColors.textLight }]}>Please sync your device or check back later.</Text>
                    </View>
                ) : (
                    Object.entries(groupedOptions).map(([groupName, items]) => (
                        <View key={groupName} style={styles.groupContainer}>
                            <Text style={[styles.groupTitle, { color: themeColors.text }]}>{groupName}</Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.cardsWrapper}
                                snapToInterval={280 + spacing.xl}
                                snapToAlignment="center"
                                decelerationRate="fast"
                            >
                                {items.map((item) => {
                                    const theme = TIER_COLORS[item.tier as keyof typeof TIER_COLORS] || TIER_COLORS.good;
                                    const isRecommended = item.tier === 'better';

                                    return (
                                        <View key={item.id} style={styles.cardContainer}>
                                            {isRecommended && (
                                                <View style={styles.recommendedBadge}>
                                                    <Ionicons name="star" size={12} color={themeColors.textInverse} style={{ marginRight: 4 }} />
                                                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                                </View>
                                            )}
                                            <View style={[
                                                styles.card,
                                                { backgroundColor: cardBg, borderColor: isRecommended ? theme.text : (isDark ? borderColor : theme.border) },
                                                isRecommended && styles.cardRecommended
                                            ]}>
                                                <View style={[styles.cardHeader, { backgroundColor: isDark ? themeColors.surface : theme.bg, borderBottomColor: borderColor }]}>
                                                    <Text style={[styles.cardTier, { color: theme.text }]}>
                                                        {item.tier.toUpperCase()}
                                                    </Text>
                                                </View>

                                                <View style={styles.cardBody}>
                                                    <Text style={[styles.cardPrice, { color: themeColors.text }]}>${item.price.toFixed(2)}</Text>

                                                    {item.description ? (
                                                        <Text style={[styles.cardDescription, { color: themeColors.textSecondary }]}>{item.description}</Text>
                                                    ) : (
                                                        <View style={styles.placeholderRow}>
                                                            <Ionicons name="checkmark" size={16} color={themeColors.success} />
                                                            <Text style={[styles.placeholderText, { color: themeColors.textSecondary }]}>Standard inclusion</Text>
                                                        </View>
                                                    )}

                                                    <TouchableOpacity style={[
                                                        styles.selectButton,
                                                        { backgroundColor: isRecommended ? theme.text : themeColors.primary }
                                                    ]}>
                                                        <Text style={styles.selectButtonText}>Select Option</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ))
                )}
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
        backgroundColor: '#FFF',
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h2,
        color: colors.text,
    },
    headerSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    content: {
        padding: spacing.xl,
        gap: spacing['2xl'],
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing['4xl'],
    },
    emptyText: {
        ...typography.h3,
        color: colors.textSecondary,
        marginTop: spacing.xl,
        marginBottom: spacing.xs,
    },
    emptySubText: {
        ...typography.body,
        color: colors.textLight,
    },
    groupContainer: {
        gap: spacing.lg,
    },
    groupTitle: {
        ...typography.h3,
        color: colors.text,
        textAlign: 'center',
    },
    cardsWrapper: {
        gap: spacing.xl,
        paddingHorizontal: spacing.sm, // Add slight padding for shadow clipping
        paddingTop: spacing.lg,        // Room for the absolute positioned badge
        paddingBottom: spacing.md,     // Room for drop shadow
    },
    cardContainer: {
        width: 280,
        position: 'relative',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -12,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        backgroundColor: ACCENT,
        paddingVertical: 4,
        marginHorizontal: spacing.xl,
        borderRadius: 12,
        zIndex: 10,
    },
    recommendedText: {
        ...typography.caption,
        color: colors.textInverse,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        flex: 1,
    },
    cardRecommended: {
        borderWidth: 2,
        transform: [{ scale: 1.02 }],
    },
    cardHeader: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    cardTier: {
        ...typography.h4,
        letterSpacing: 1,
    },
    cardBody: {
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.lg,
    },
    cardPrice: {
        fontSize: 42,
        fontWeight: '800',
        color: colors.text,
    },
    cardDescription: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    placeholderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    placeholderText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    selectButton: {
        backgroundColor: ACCENT,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing['2xl'],
        borderRadius: borderRadius.md,
        width: '100%',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    selectButtonText: {
        ...typography.button,
        color: colors.textInverse,
    },
});

// Observe live data from watermelondb so it instantly reacts to syncs/changes.
const enhance = withObservables([], () => ({
    pricebooks: database.collections.get<Pricebook>('pricebooks').query(),
}));

export default enhance(PricebookPresentationScreen);
