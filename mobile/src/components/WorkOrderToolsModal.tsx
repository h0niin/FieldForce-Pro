import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';

interface WorkOrderToolsModalProps {
    visible: boolean;
    onClose: () => void;
    workOrderId: string;
}

export function WorkOrderToolsModal({ visible, onClose, workOrderId }: WorkOrderToolsModalProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const handleNavigate = (path: string) => {
        onClose();
        // Use setTimeout to allow the modal to close smoothly before navigating
        setTimeout(() => {
            router.push(path as any);
        }, 150);
    };

    const tools = [
        {
            id: 'verify',
            label: 'Verify Work',
            icon: 'camera',
            color: colors.primary,
            path: `/work-order/verify/${workOrderId}`,
            description: 'AI Camera Verification'
        },

        {
            id: 'voice',
            label: 'Voice Note',
            icon: 'mic',
            color: colors.warning,
            path: `/work-order/voice/${workOrderId}`,
            description: 'Record & Transcribe'
        },
        {
            id: 'scan',
            label: 'Scan Code',
            icon: 'qr-code',
            color: colors.success,
            path: `/work-order/scan/${workOrderId}`,
            description: 'Barcode & QR Reader'
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.sheet, { paddingBottom: insets.bottom || spacing.xl }]}>
                            {/* Handle */}
                            <View style={styles.handleContainer}>
                                <View style={styles.handle} />
                            </View>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Verification & Tools</Text>
                                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="close-circle" size={24} color={colors.textLight} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.subtitle}>Select a tool to verify or document work</Text>

                            {/* Tools Grid */}
                            <View style={styles.grid}>
                                {tools.map((tool) => (
                                    <TouchableOpacity
                                        key={tool.id}
                                        style={styles.gridItem}
                                        onPress={() => handleNavigate(tool.path)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: tool.color + '15' }]}>
                                            <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                                        </View>
                                        <Text style={styles.itemLabel}>{tool.label}</Text>
                                        <Text style={styles.itemDesc}>{tool.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        ...shadows.lg,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        ...typography.h3,
        color: colors.text,
    },
    subtitle: {
        ...typography.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        marginTop: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    gridItem: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderLight,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    itemLabel: {
        ...typography.label,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    itemDesc: {
        ...typography.caption,
        color: colors.textLight,
        textAlign: 'center',
        fontSize: 11,
    },
});
