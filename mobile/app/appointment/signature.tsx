import { useRef, useState } from 'react';
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
import { appointmentsApi } from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad';
import { goBack } from '@/utils/navigation';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
const ACCENT = '#4F6BF6';

export default function SignatureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const padRef = useRef<SignaturePadHandle>(null);
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  // true once the user makes their first stroke on the canvas
  const [isSigned, setIsSigned] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  // measured once via onLayout — gives the WebView a concrete pixel height
  const [canvasHeight, setCanvasHeight] = useState(0);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleClear = () => {
    padRef.current?.clear();
    setIsSigned(false);
  };

  /** Triggered by padRef.save() → SignatureCanvas.readSignature() → onOK */
  const handleSignatureReady = async (signature: string) => {
    if (!id) {
      Alert.alert('Error', 'No appointment ID provided.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const uri =
        signature.startsWith('data:') || signature.startsWith('file://')
          ? signature
          : `data:image/png;base64,${signature}`;

      formData.append('signature', {
        uri,
        name: 'signature.png',
        type: 'image/png',
      } as any);

      await appointmentsApi.uploadSignature(id, formData);
      setIsUploaded(true);
      AuditLogger.log({
        action: AUDIT_ACTIONS.APPOINTMENT_SIGNATURE,
        module: AUDIT_MODULES.APPOINTMENTS,
        record_id: id,
        new_values: { appointment_id: id, signature_captured: true },
      });
    } catch {
      Alert.alert(
        'Upload Failed',
        'The signature could not be saved to the server.',
        [
          { text: 'Retry', onPress: () => handleSignatureReady(signature) },
          { text: 'Skip Upload', onPress: () => setIsUploaded(true) },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAndContinue = () => {
    padRef.current?.save();
  };

  const handleContinueToComplete = () => {
    router.replace(id ? `/appointment/complete?id=${id}` : '/(tabs)/home');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Signature',
      'Are you sure you want to skip capturing the customer signature?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: handleContinueToComplete },
      ],
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
          backgroundColor: isDark ? themeColors.background : '#F8F9FB',
        },
      ]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Confirm Work</Text>
        <TouchableOpacity
          onPress={handleSkip}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Info Banner ── */}
      {!isUploaded && (
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="create-outline" size={18} color={ACCENT} />
          </View>
          <View style={styles.infoBannerBody}>
            <Text style={[styles.infoBannerTitle, { color: themeColors.text }]}>Customer signature required</Text>
            <Text style={[styles.infoBannerSubtitle, { color: themeColors.textSecondary }]}>
              Please hand the device to the customer to sign below.
            </Text>
          </View>
        </View>
      )}

      {/* ── Main area (canvas or success) ── */}
      {isUploaded ? (
        <View style={styles.successArea}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={64} color={themeColors.success} />
          </View>
          <Text style={styles.successTitle}>Signature Captured</Text>
          <Text style={[styles.successSubtitle, { color: themeColors.textSecondary }]}>
            The customer's signature has been saved successfully.
          </Text>
        </View>
      ) : (
        <View style={[styles.canvasCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Card header */}
          <View style={[styles.canvasCardHeader, { borderBottomColor: themeColors.divider }]}>
            <View style={styles.canvasLabelRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: isSigned ? themeColors.success : themeColors.textLight },
                ]}
              />
              <Text style={[styles.canvasLabel, { color: themeColors.textSecondary }]}>{isSigned ? 'SIGNED' : 'SIGN BELOW'}</Text>
            </View>
            {isSigned && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <Ionicons name="refresh-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.clearBtnText}>Clear & Redo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Canvas — flex:1 fills all remaining card space */}
          <View
            style={styles.canvasArea}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              // only set once so the SignaturePad doesn't remount
              if (h > 0 && canvasHeight === 0) setCanvasHeight(h);
            }}
          >
            {canvasHeight > 0 && (
              <SignaturePad
                ref={padRef}
                onSave={handleSignatureReady}
                onBegin={() => setIsSigned(true)}
                height={canvasHeight}
              />
            )}

            {/* "Draw here" hint — rendered above the WebView, never blocks touches */}
            {!isSigned && canvasHeight > 0 && (
              <View style={styles.signHint} pointerEvents="none">
                <Ionicons name="pencil-outline" size={36} color={colors.border} />
                <Text style={styles.signHintText}>Draw signature here</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Footer button ── */}
      <View style={styles.footer}>
        {isUploaded ? (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinueToComplete}>
            <Ionicons name="checkmark-done" size={20} color={colors.textInverse} />
            <Text style={styles.continueBtnText}>Continue to Complete Job</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!isSigned || isUploading) && styles.saveBtnDisabled,
            ]}
            disabled={!isSigned || isUploading}
            onPress={handleSaveAndContinue}
          >
            {isUploading ? (
              <>
                <ActivityIndicator color={colors.textInverse} size="small" />
                <Text style={styles.saveBtnText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={isSigned ? 'checkmark-circle' : 'pencil'}
                  size={20}
                  color={isSigned ? colors.textInverse : colors.textLight}
                />
                <Text
                  style={[styles.saveBtnText, !isSigned && styles.saveBtnTextDisabled]}
                >
                  {isSigned ? 'Confirm Signature' : 'Draw signature above'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: spacing.lg,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  skipText: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // ── Info Banner ──────────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ACCENT + '0D',
    borderWidth: 1,
    borderColor: ACCENT + '25',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoBannerBody: {
    flex: 1,
    gap: 3,
  },
  infoBannerTitle: {
    ...typography.label,
    color: colors.text,
  },
  infoBannerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Canvas card ──────────────────────────────────────────────────────────
  canvasCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  canvasCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  canvasLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  canvasLabel: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
  },
  clearBtnText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  canvasArea: {
    flex: 1,
  },
  signHint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  signHintText: {
    ...typography.body,
    color: colors.border,
  },

  // ── Success state ────────────────────────────────────────────────────────
  successArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...typography.h2,
    color: colors.success,
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
    lineHeight: 22,
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    // wrapper keeps layout stable while the button swaps
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
  },
  saveBtnDisabled: {
    backgroundColor: colors.borderLight,
  },
  saveBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  saveBtnTextDisabled: {
    color: colors.textLight,
  },
  continueBtn: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
