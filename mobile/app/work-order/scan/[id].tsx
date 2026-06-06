import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { workOrderNotesApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ScanCodeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    // Camera & Permissions
    const [permission, requestPermission] = useCameraPermissions();
    const [scannedData, setScannedData] = useState<string | null>(null);
    const [scannedType, setScannedType] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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
                <Text style={styles.permissionText}>We need your permission to use the camera for scanning.</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                    <Text style={styles.primaryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scannedData) return; // Prevent multiple scans
        setScannedType(type);
        setScannedData(data);
    };

    const handleRescan = () => {
        setScannedData(null);
        setScannedType(null);
    };

    const saveToNotes = async () => {
        if (!id || !scannedData) return;
        setIsProcessing(true);
        try {
            const typeLabel = scannedType?.includes('qr') ? 'QR Code' : 'Barcode';
            const noteContent = `Scanned ${typeLabel}: ${scannedData}`;

            await workOrderNotesApi.create({
                work_order_id: id,
                content: noteContent,
                is_internal: true, // Keep it internal by default
            });

            router.replace({
                pathname: `/work-order/result/${id}` as any,
                params: {
                    status: 'success',
                    title: 'Barcode Saved',
                    message: 'Scanned data has been attached to the work order.',
                    details: noteContent
                }
            });
        } catch {
            Alert.alert('Error', 'Failed to save scanned data. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* State 1: Scanning */}
            {!scannedData ? (
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: [
                            'qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'pdf417'
                        ],
                    }}
                >
                    <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                                <Ionicons name="close" size={28} color={colors.white} />
                            </TouchableOpacity>
                            <Text style={styles.overlayTitle}>Scan Barcode or QR</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        {/* Viewfinder Target */}
                        <View style={styles.viewfinderContainer}>
                            <View style={styles.viewfinderRect}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                        </View>

                        {/* Footer Hint */}
                        <View style={styles.footerHint}>
                            <Text style={styles.hintText}>Point camera at a code to scan automatically</Text>
                        </View>
                    </View>
                </CameraView>
            ) : (
                /* State 2: Scanned Result */
                <View style={[styles.resultContainer, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
                    <View style={[styles.headerGeneric, { backgroundColor: cardBg, borderBottomColor: colors.borderLight }]}>
                        <TouchableOpacity style={styles.backButtonGeneric} onPress={handleRescan} disabled={isProcessing}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.titleGeneric, { color: colors.text }]}>Scan Result</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.resultContent}>
                        <View style={styles.scanIconWrapper}>
                            <Ionicons name="barcode-outline" size={64} color={colors.primary} />
                        </View>

                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Scanned Data:</Text>
                        <View style={[styles.dataCard, { backgroundColor: cardBg, borderColor }]}>
                            <Text style={[styles.dataText, { color: colors.text }]} selectable>{scannedData}</Text>
                            <Text style={styles.typeText}>Type: {scannedType?.split('.')?.[1] || scannedType || 'Unknown'}</Text>
                        </View>

                        <View style={{ flex: 1 }} />

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.rescanButton, { backgroundColor: cardBg, borderColor: colors.border }]} onPress={handleRescan} disabled={isProcessing}>
                                <Ionicons name="scan" size={20} color={colors.text} />
                                <Text style={styles.rescanText}>Scan Again</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, isProcessing && { opacity: 0.7 }]}
                                onPress={saveToNotes}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <ActivityIndicator size="small" color={colors.white} />
                                        <Text style={styles.saveText}>Saving...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={20} color={colors.white} />
                                        <Text style={styles.saveText}>Save to Notes</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
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
    // Scanner UI
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    overlayTitle: {
        ...typography.h3,
        color: colors.white,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewfinderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewfinderRect: {
        width: 250,
        height: 250,
        position: 'relative',
        backgroundColor: 'transparent',
        // The trick to cut out the overlay is complex without external libs
        // so we simulate the "hole" using borders
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.primary,
    },
    topLeft: {
        top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    footerHint: {
        paddingBottom: spacing.xl,
        alignItems: 'center',
    },
    hintText: {
        ...typography.body,
        color: colors.white,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    // Result UI
    resultContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGeneric: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    backButtonGeneric: {
        padding: spacing.xs,
    },
    titleGeneric: {
        ...typography.h3,
        color: colors.text,
    },
    resultContent: {
        flex: 1,
        padding: spacing.xl,
    },
    scanIconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing.xl,
    },
    resultLabel: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    dataCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dataText: {
        ...typography.body,
        fontSize: 18,
        color: colors.text,
        marginBottom: spacing.sm,
        fontWeight: '500',
    },
    typeText: {
        ...typography.caption,
        color: colors.textLight,
        textTransform: 'uppercase',
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    rescanButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    rescanText: {
        ...typography.button,
        color: colors.text,
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        gap: spacing.sm,
    },
    saveText: {
        ...typography.button,
        color: colors.white,
    },
});
