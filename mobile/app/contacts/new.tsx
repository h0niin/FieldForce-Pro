import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { contactsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';

// ─── Reusable field primitives ────────────────────────────────────────────────

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
    return (
        <View style={styles.labelRow}>
            <Text style={styles.label}>{text}</Text>
            {required && <Text style={styles.required}>*</Text>}
        </View>
    );
}

function TextField({
    label,
    value,
    onChangeText,
    placeholder,
    required,
    multiline,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
}: any) {
    return (
        <View style={styles.fieldWrap}>
            <FieldLabel text={label} required={required} />
            <TextInput
                style={[styles.input, multiline && styles.inputMultiline]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textLight}
                multiline={multiline}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );
}

export default function NewContactScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [tags, setTags] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Invalid email address';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        setSubmitting(true);
        try {
            const res = await contactsApi.create({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                ...(email.trim() && { email: email.trim() }),
                ...(phone.trim() && { phone: phone.trim() }),
                ...(address.trim() && { address: address.trim() }),
                ...(tags.trim() && { tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
            });

            if (res.data.status) {
                Alert.alert('Success', 'Contact created successfully');
                router.back();
            } else {
                Alert.alert('Error', res.data.message || 'Failed to create contact');
            }
        } catch (error) {
            console.error('Failed to create contact:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color={c.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: c.text }]}>New Contact</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={submitting}
                    style={styles.headerBtn}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color={ACCENT} />
                    ) : (
                        <Text style={styles.saveText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={[styles.contentInner, { paddingBottom: insets.bottom + spacing.xl }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Basic Information</Text>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                        <TextField
                            label="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="e.g. John"
                            required
                        />
                        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

                        <TextField
                            label="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="e.g. Doe"
                            required
                        />
                        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Contact Details</Text>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                        <TextField
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="john.doe@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        <TextField
                            label="Phone"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+1 234 567 8900"
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Additional Info</Text>
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                        <TextField
                            label="Address"
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Full service address…"
                            multiline
                        />

                        <TextField
                            label="Tags"
                            value={tags}
                            onChangeText={setTags}
                            placeholder="e.g. VIP, Residential (comma separated)"
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerBtn: {
        width: 60,
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h4,
        color: colors.text,
        fontWeight: 'bold',
    },
    saveText: {
        ...typography.body,
        color: ACCENT,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentInner: {
        padding: spacing.lg,
        gap: spacing.xl,
    },
    section: {
        gap: spacing.sm,
    },
    sectionTitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: spacing.xs,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fieldWrap: {
        gap: spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    label: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    required: {
        color: colors.error,
        fontSize: 12,
    },
    input: {
        backgroundColor: '#F8F9FB',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        ...typography.body,
        color: colors.text,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: spacing.sm,
    },
    errorText: {
        ...typography.caption,
        color: colors.error,
        marginTop: -spacing.xs,
    },
});
