import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    ScrollView
} from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { workOrderAttachmentsApi } from '@/api/endpoints';

export default function VerifyWorkScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
    const { id, mode: initialMode } = useLocalSearchParams<{ id: string; mode?: string }>();

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType, setCameraType] = useState<CameraType>('back');
    const cameraRef = useRef<CameraView>(null);

    const [mode, setMode] = useState<'single' | 'compare'>(initialMode === 'compare' ? 'compare' : 'single');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [beforeUri, setBeforeUri] = useState<string | null>(null);
    const [afterUri, setAfterUri] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission, requestPermission]);

    if (!permission) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="camera-outline" size={64} color={colors.textLight} />
                <Text style={styles.permissionText}>We need your permission to use the camera</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                    <Text style={styles.primaryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setCameraType((current) => (current === 'back' ? 'front' : 'back'));
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;
        try {
            const result = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: true,
            });
            if (result && result.uri) {
                if (mode === 'single') {
                    setPhotoUri(result.uri);
                } else if (mode === 'compare') {
                    if (!beforeUri) {
                        setBeforeUri(result.uri);
                    } else if (!afterUri) {
                        setAfterUri(result.uri);
                    }
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take picture. Please try again.');
        }
    };

    const submitVerification = async () => {
        if (!id) return;
        setIsSubmitting(true);
        setIsVerifying(true);

        try {
            if (mode === 'single' && photoUri) {
                const fileName = `verification_${Date.now()}.jpg`;
                await workOrderAttachmentsApi.create({
                    work_order_id: id,
                    file_url: photoUri,
                    file_name: fileName,
                    file_type: 'image/jpeg',
                });
                await new Promise((resolve) => setTimeout(resolve, 2000));
            } else if (mode === 'compare' && beforeUri && afterUri) {
                const timestamp = Date.now();
                await workOrderAttachmentsApi.create({
                    work_order_id: id,
                    file_url: beforeUri,
                    file_name: `before_${timestamp}.jpg`,
                    file_type: 'image/jpeg',
                });
                await workOrderAttachmentsApi.create({
                    work_order_id: id,
                    file_url: afterUri,
                    file_name: `after_${timestamp}.jpg`,
                    file_type: 'image/jpeg',
                });
            }

            setIsVerifying(false);

            router.replace({
                pathname: `/work-order/result/${id}` as any,
                params: {
                    status: 'success',
                    title: mode === 'single' ? 'Verification Successful!' : 'Comparison Saved',
                    message: mode === 'single'
                        ? 'Photo has been verified and saved to the work order.'
                        : 'Before & After photos successfully saved to the work order.',
                }
            });

        } catch (error) {
            setIsVerifying(false);
            setIsSubmitting(false);
            Alert.alert('Submission Failed', 'Failed to submit photos. Please try again.');
        }
    };

    const renderPreview = () => {
        if (mode === 'single') {
            return (
                <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.header, { backgroundColor: colors.background }]}>
                        <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.text }]}>Review Photo</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.previewContainer}>
                        <Image source={{ uri: photoUri! }} style={styles.previewImage} resizeMode="contain" />

                        {isVerifying && (
                            <View style={styles.verifyingOverlay}>
                                <ActivityIndicator size="large" color={colors.white} />
                                <Text style={styles.verifyingText}>AI Verification in progress...</Text>
                            </View>
                        )}
                    </View>

                    <View style={[styles.actionRow, { backgroundColor: colors.background }]}>
                        <TouchableOpacity
                            style={[styles.retakeButton, { backgroundColor: cardBg, borderColor: colors.border }]}
                            onPress={() => setPhotoUri(null)}
                            disabled={isSubmitting}
                        >
                            <Ionicons name="refresh" size={24} color={colors.text} />
                            <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={submitVerification}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitText}>
                                {isSubmitting ? 'Submitting...' : 'Verify Work'}
                            </Text>
                            {!isSubmitting && <Ionicons name="checkmark-circle" size={20} color={colors.white} />}
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        if (mode === 'compare' && beforeUri && afterUri) {
            return (
                <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    <View style={[styles.header, { backgroundColor: colors.background }]}>
                        <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.text }]}>Review Comparison</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.compareScrollContent}>
                        <View style={[styles.comparePhotoContainer, { backgroundColor: cardBg, borderColor }]}>
                            <Text style={[styles.comparePhotoLabel, { color: colors.text }]}>Before Photo</Text>
                            <Image source={{ uri: beforeUri }} style={styles.compareImage} resizeMode="cover" />
                            <TouchableOpacity style={styles.compareRetakeBtn} onPress={() => setBeforeUri(null)} disabled={isSubmitting}>
                                <Text style={styles.compareRetakeText}>Retake Before Photo</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.comparePhotoContainer, { backgroundColor: cardBg, borderColor }]}>
                            <Text style={[styles.comparePhotoLabel, { color: colors.text }]}>After Photo</Text>
                            <Image source={{ uri: afterUri }} style={styles.compareImage} resizeMode="cover" />
                            <TouchableOpacity style={styles.compareRetakeBtn} onPress={() => setAfterUri(null)} disabled={isSubmitting}>
                                <Text style={styles.compareRetakeText}>Retake After Photo</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {isVerifying && (
                        <View style={styles.verifyingOverlay}>
                            <ActivityIndicator size="large" color={colors.white} />
                            <Text style={styles.verifyingText}>Uploading photos...</Text>
                        </View>
                    )}

                    <View style={[styles.actionRow, { backgroundColor: colors.background }]}>
                        <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={submitVerification} disabled={isSubmitting}>
                            <Text style={styles.submitText}>{isSubmitting ? 'Submitting...' : 'Submit Comparison'}</Text>
                            {!isSubmitting && <Ionicons name="cloud-upload" size={20} color={colors.white} />}
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return null;
    };

    const showPreview = (mode === 'single' && photoUri) || (mode === 'compare' && beforeUri && afterUri);

    if (showPreview) {
        return renderPreview();
    }

    let instructionText = 'Position work in frame';
    if (mode === 'compare') {
        instructionText = !beforeUri ? 'Take "Before" photo' : 'Take "After" photo';
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing={cameraType} ref={cameraRef}>
                <View style={[styles.cameraOverlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                            <Ionicons name="close" size={28} color={colors.white} />
                        </TouchableOpacity>

                        <View style={styles.instructionBadge}>
                            <Ionicons name="scan-outline" size={16} color={colors.white} />
                            <Text style={styles.instructionText}>{instructionText}</Text>
                        </View>

                        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                            <Ionicons name="camera-reverse" size={28} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    {/* Guide Frame */}
                    <View style={styles.guideContainer}>
                        <View style={styles.guideFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>

                    {/* Bottom Bar */}
                    <View style={styles.bottomBar}>
                        <View style={styles.modeToggleContainer}>
                            <TouchableOpacity
                                style={[styles.modeButton, mode === 'single' && styles.modeButtonActive]}
                                onPress={() => setMode('single')}
                            >
                                <Text style={[styles.modeText, mode === 'single' && styles.modeTextActive]}>Single</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeButton, mode === 'compare' && styles.modeButtonActive]}
                                onPress={() => setMode('compare')}
                            >
                                <Text style={[styles.modeText, mode === 'compare' && styles.modeTextActive]}>Before/After</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
        gap: spacing.lg,
    },
    permissionText: {
        ...typography.body,
        textAlign: 'center',
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
        width: '100%',
        alignItems: 'center',
    },
    primaryButtonText: {
        ...typography.button,
        color: colors.white,
    },
    secondaryButton: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...typography.button,
        color: colors.primary,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    instructionText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
    guideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideFrame: {
        width: '80%',
        aspectRatio: 3 / 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: spacing.sm,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: colors.primary,
    },
    topLeft: {
        top: -1,
        left: -1,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: spacing.sm,
    },
    topRight: {
        top: -1,
        right: -1,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: spacing.sm,
    },
    bottomLeft: {
        bottom: -1,
        left: -1,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: spacing.sm,
    },
    bottomRight: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: spacing.sm,
    },
    bottomBar: {
        paddingBottom: spacing.xl,
        alignItems: 'center',
    },
    captureButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    captureButtonInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.background,
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
        justifyContent: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    verifyingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    verifyingText: {
        color: colors.white,
        ...typography.h3,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: colors.background,
        gap: spacing.md,
    },
    retakeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    retakeText: {
        ...typography.button,
        color: colors.text,
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        gap: spacing.sm,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        ...typography.button,
        color: colors.white,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: borderRadius.full,
        padding: 4,
        marginBottom: spacing.xl,
    },
    modeButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    modeButtonActive: {
        backgroundColor: colors.white,
    },
    modeText: {
        ...typography.bodySmall,
        color: colors.white,
        fontWeight: '600',
    },
    modeTextActive: {
        color: colors.text,
    },
    compareScrollContent: {
        padding: spacing.lg,
        gap: spacing.xl,
    },
    comparePhotoContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    comparePhotoLabel: {
        ...typography.h3,
        marginBottom: spacing.sm,
        color: colors.text,
        textAlign: 'center'
    },
    compareImage: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background,
    },
    compareRetakeBtn: {
        marginTop: spacing.md,
        padding: spacing.sm,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
    },
    compareRetakeText: {
        ...typography.button,
        color: colors.textSecondary,
    },
});
