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
import { contactsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';
import type { Contact } from '@/types/models';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (contact: Contact) => void;
    title?: string;
}

export function ContactPickerModal({
    visible,
    onClose,
    onSelect,
    title = 'Select Contact',
}: Props) {
    const insets = useSafeAreaInsets();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await contactsApi.getAllNonPaginated();
            setContacts(res.data.data ?? []);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            fetchContacts();
            setSearch('');
        }
    }, [visible, fetchContacts]);

    const filtered = contacts.filter((c) => {
        const query = search.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        return (
            fullName.includes(query) ||
            c.phone?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        );
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
                        placeholder="Search by name, phone, or email..."
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
                        <Ionicons name="person-outline" size={48} color={colors.textLight} />
                        <Text style={styles.emptyText}>
                            {search ? 'No contacts match your search' : 'No contacts found'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                    >
                        {filtered.map((contact) => (
                            <TouchableOpacity
                                key={contact.id}
                                style={styles.item}
                                onPress={() => {
                                    onSelect(contact);
                                    onClose();
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {contact.first_name[0]}{contact.last_name[0]}
                                    </Text>
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.name}>
                                        {contact.first_name} {contact.last_name}
                                    </Text>
                                    <View style={styles.meta}>
                                        {contact.phone && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="call-outline" size={12} color={colors.textLight} />
                                                <Text style={styles.metaText}>{contact.phone}</Text>
                                            </View>
                                        )}
                                        {contact.email && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="mail-outline" size={12} color={colors.textLight} />
                                                <Text style={styles.metaText} numberOfLines={1}>{contact.email}</Text>
                                            </View>
                                        )}
                                    </View>
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
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...typography.label,
        color: colors.primary,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    name: {
        ...typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    meta: {
        marginTop: 4,
        gap: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
