import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SignatureCanvas, { type SignatureViewRef } from 'react-native-signature-canvas';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';

const ACCENT = '#4F6BF6';

// Force the WebView's internal HTML/canvas to fill the entire viewport. Without
// these rules signature_pad defaults the canvas to ~150px tall so only the top
// portion is drawable.
const SIG_WEBSTYLE = `
  html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; }
  .m-signature-pad { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: none; }
  .m-signature-pad--footer { display: none; }
  canvas { width: 100% !important; height: 100% !important; }
`;

/**
 * Reusable on-screen signature capture modal. The parent controls visibility and
 * receives the captured signature (base64 data-URI) via onConfirm.
 */
export function SignatureCaptureModal({
  visible,
  onClose,
  onConfirm,
  loading,
  title = 'Customer Signature',
  instructions = 'Ask the customer to sign below to confirm.',
  confirmLabel = 'Save Signature',
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (sig: string) => void;
  loading: boolean;
  title?: string;
  instructions?: string;
  confirmLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const sigRef = useRef<SignatureViewRef>(null);
  const awaitingConfirm = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  const handleOK = (sig: string) => {
    if (!sig || sig === 'data:,') return;
    setHasSig(true);
    if (awaitingConfirm.current) {
      awaitingConfirm.current = false;
      onConfirm(sig);
    }
  };

  const handleClear = () => {
    awaitingConfirm.current = false;
    sigRef.current?.clearSignature();
    setHasSig(false);
  };

  const handleConfirm = () => {
    awaitingConfirm.current = true;
    sigRef.current?.readSignature();
  };

  const handleClose = () => {
    awaitingConfirm.current = false;
    setHasSig(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[sigStyles.container, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={sigStyles.header}>
          <TouchableOpacity onPress={handleClose} style={sigStyles.closeBtn} disabled={loading}>
            <Text style={sigStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={sigStyles.title}>{title}</Text>
          <View style={{ width: 64 }} />
        </View>

        <Text style={sigStyles.instructions}>{instructions}</Text>

        <View style={sigStyles.canvasWrapper}>
          <SignatureCanvas
            ref={sigRef}
            onOK={handleOK}
            onBegin={() => setHasSig(true)}
            webStyle={SIG_WEBSTYLE}
            backgroundColor="#fff"
            penColor={colors.text}
            style={{ flex: 1 }}
          />
        </View>

        <Text style={sigStyles.statusHint}>
          {hasSig ? '✓ Signature captured — tap to confirm' : 'Draw signature above'}
        </Text>

        <View style={sigStyles.controls}>
          <TouchableOpacity style={sigStyles.clearBtn} onPress={handleClear} disabled={loading}>
            <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
            <Text style={sigStyles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sigStyles.confirmBtn, (!hasSig || loading) && sigStyles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!hasSig || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={sigStyles.confirmBtnText}>{confirmLabel}</Text>
                </>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const sigStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  closeBtn: { minWidth: 64 },
  closeBtnText: { ...typography.body, color: ACCENT },
  title: { ...typography.h3, color: colors.text },
  instructions: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  canvasWrapper: { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  statusHint: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.sm, minHeight: 18 },
  controls: { flexDirection: 'row', gap: spacing.md, paddingBottom: spacing.sm },
  clearBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { ...typography.button, color: colors.textSecondary },
  confirmBtn: { flex: 2, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { ...typography.button, color: '#fff' },
});
