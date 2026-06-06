import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { serviceLocationsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import type { ServiceLocation } from '@/types/models';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (location: ServiceLocation) => void;
    title?: string;
}

export function ServiceLocationPickerModal({
    visible,
    onClose,
    onSelect,
    title = 'Select Service Location',
}: Props) {
    const insets = useSafeAreaInsets();
    const [locations, setLocations] = useState<ServiceLocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            // Always fetch all locations to align with the Service Location module
            const res = await serviceLocationsApi.getAllNonPaginated();
            setLocations(res.data.data ?? []);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            fetchLocations();
            setSearch('');
        }
    }, [visible, fetchLocations]);

    const filtered = locations.filter((l) => {
        const query = search.toLowerCase();
        return l.address.toLowerCase().includes(query);
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top || spacing.xl }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={{ width: 60 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchRow}>
                    <Ionicons name="search-outline" size={18} color={colors.textLight} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by address..."
                        placeholderTextColor={colors.textLight}
                        value={search}
                        onChangeText={setSearch}
                        autoCorrect={false}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textLight} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary} size="large" />
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="location-outline" size={48} color={colors.textLight} />
                        <Text style={styles.emptyText}>
                            {search ? 'No locations match your search' : 'No locations found'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                    >
                        {filtered.map((location) => (
                            <TouchableOpacity
                                key={location.id}
                                style={styles.item}
                                onPress={() => {
                                    onSelect(location);
                                    onClose();
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconBox}>
                                    <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.address}>{location.address}</Text>
                                    {location.gate_code && (
                                        <View style={styles.metaRow}>
                                            <Ionicons name="lock-closed-outline" size={12} color={colors.textSecondary} />
                                            <Text style={styles.metaText}>Gate: {location.gate_code}</Text>
                                        </View>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    title: {
        ...typography.h4,
        color: colors.text,
        fontWeight: 'bold',
    },
    cancelText: {
        ...typography.body,
        color: colors.primary,
        width: 60,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        margin: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.text,
        padding: 0,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingBottom: 100,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    emptySubText: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    list: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['4xl'],
        gap: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    address: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    metaText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
