import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { workOrderAttachmentsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ComparePhotosScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const [beforeUri, setBeforeUri] = useState<string | null>(null);
    const [afterUri, setAfterUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const pickImage = async (type: 'before' | 'after') => {
        Alert.alert(`Upload ${type === 'before' ? 'Before' : 'After'} Photo`, 'Choose an option', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Take Photo',
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission required', 'Camera access is needed.');
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                    });
                    if (!result.canceled && result.assets.length > 0) {
                        type === 'before' ? setBeforeUri(result.assets[0].uri) : setAfterUri(result.assets[0].uri);
                    }
                },
            },
            {
                text: 'Choose from Gallery',
                onPress: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission required', 'Gallery access is needed.');
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                    });
                    if (!result.canceled && result.assets.length > 0) {
                        type === 'before' ? setBeforeUri(result.assets[0].uri) : setAfterUri(result.assets[0].uri);
                    }
                },
            },
        ]);
    };

    const submitComparison = async () => {
        if (!id || !beforeUri || !afterUri) return;
        setIsSubmitting(true);
        try {
            setUploadProgress('Uploading Before Photo...');
            const timestamp = Date.now();

            await workOrderAttachmentsApi.create({
                work_order_id: id,
                file_url: beforeUri,
                file_name: `before_${timestamp}.jpg`,
                file_type: 'image/jpeg',
            });

            setUploadProgress('Uploading After Photo...');
            await workOrderAttachmentsApi.create({
                work_order_id: id,
                file_url: afterUri,
                file_name: `after_${timestamp}.jpg`,
                file_type: 'image/jpeg',
            });

            setUploadProgress('');
            Alert.alert(
                'Success',
                'Photos successfully uploaded for comparison.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch {
            setUploadProgress('');
            Alert.alert('Error', 'Failed to upload photos. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={[
                styles.content,
                { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
            ]}
        >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isSubmitting}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Ionicons name="images" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Before & After</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Capture the work progress</Text>
            </View>

            <View style={styles.photosContainer}>
                {/* Before Photo */}
                <View style={styles.photoBlock}>
                    <Text style={[styles.photoLabel, { color: colors.text }]}>Before Work</Text>
                    <TouchableOpacity
                        style={[styles.photoPlaceholder, { backgroundColor: cardBg, borderColor }]}
                        onPress={() => pickImage('before')}
                        disabled={isSubmitting}
                    >
                        {beforeUri ? (
                            <Image source={{ uri: beforeUri }} style={styles.image} resizeMode="cover" />
                        ) : (
                            <View style={styles.placeholderContent}>
                                <Ionicons name="camera-outline" size={40} color={colors.textLight} />
                                <Text style={styles.placeholderText}>Tap to add</Text>
                            </View>
                        )}
                        {beforeUri && (
                            <View style={styles.editIconOverlay}>
                                <Ionicons name="pencil" size={16} color={colors.white} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Arrow Divider */}
                <Ionicons name="arrow-forward" size={32} color={colors.textSecondary} style={{ marginTop: 24 }} />

                {/* After Photo */}
                <View style={styles.photoBlock}>
                    <Text style={[styles.photoLabel, { color: colors.text }]}>After Work</Text>
                    <TouchableOpacity
                        style={[styles.photoPlaceholder, { backgroundColor: cardBg, borderColor }]}
                        onPress={() => pickImage('after')}
                        disabled={isSubmitting}
                    >
                        {afterUri ? (
                            <Image source={{ uri: afterUri }} style={styles.image} resizeMode="cover" />
                        ) : (
                            <View style={styles.placeholderContent}>
                                <Ionicons name="camera-outline" size={40} color={colors.textLight} />
                                <Text style={styles.placeholderText}>Tap to add</Text>
                            </View>
                        )}
                        {afterUri && (
                            <View style={styles.editIconOverlay}>
                                <Ionicons name="pencil" size={16} color={colors.white} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
                style={[
                    styles.submitButton,
                    (!beforeUri || !afterUri || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={submitComparison}
                disabled={!beforeUri || !afterUri || isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <ActivityIndicator color={colors.textInverse} />
                        <Text style={styles.submitButtonText}>{uploadProgress || 'Uploading...'}</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="cloud-upload-outline" size={20} color={colors.textInverse} />
                        <Text style={styles.submitButtonText}>Submit Comparison</Text>
                    </>
                )}
            </TouchableOpacity>

            {!beforeUri || !afterUri ? (
                <Text style={styles.hint}>Both before and after photos are required</Text>
            ) : null}
        </ScrollView>
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
    backButton: {
        marginBottom: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing['2xl'],
        gap: spacing.xs,
    },
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    photosContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing['2xl'],
        gap: spacing.sm,
    },
    photoBlock: {
        flex: 1,
        alignItems: 'center',
    },
    photoLabel: {
        ...typography.label,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    photoPlaceholder: {
        width: '100%',
        aspectRatio: 3 / 4,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    placeholderContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    placeholderText: {
        ...typography.caption,
        color: colors.textLight,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: spacing.xs,
        right: spacing.xs,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.xl,
    },
    submitButtonDisabled: {
        backgroundColor: colors.borderLight,
    },
    submitButtonText: {
        ...typography.button,
        color: colors.textInverse,
    },
    hint: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
        marginTop: spacing.sm,
    }
});
