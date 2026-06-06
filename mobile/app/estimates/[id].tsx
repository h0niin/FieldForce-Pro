import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SignatureCanvas, { type SignatureViewRef } from 'react-native-signature-canvas';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { estimatesApi, estimateLineItemsApi, contactsApi } from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Contact, Estimate, EstimateLineItem } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Signature capture modal ──────────────────────────────────────────────────

// Force the WebView's internal HTML/canvas to fill the entire viewport.
// Without these rules, signature_pad defaults the canvas to ~150 px tall,
// so only the top portion of the box is drawable.
const SIG_WEBSTYLE = `
  html, body {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  .m-signature-pad {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100%;
    height: 100%;
    box-shadow: none;
    border: none;
    margin: 0;
  }
  .m-signature-pad--body {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
`;

function SignatureCaptureModal({
  visible,
  onClose,
  onConfirm,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (sig: string) => void;
  loading: boolean;
}) {
  const insets = useSafeAreaInsets();
  const sigRef = useRef<SignatureViewRef>(null);
  // awaitingConfirm: set when the Approve button triggers readSignature();
  // onOK checks this flag and immediately calls onConfirm when it fires.
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
    // Always trigger readSignature(); onOK will call onConfirm via the ref flag
    awaitingConfirm.current = true;
    sigRef.current?.readSignature();
  };

  // Reset state each time the modal opens
  const handleClose = () => {
    awaitingConfirm.current = false;
    setHasSig(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[sigStyles.container, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.md }]}>
        {/* Header */}
        <View style={sigStyles.header}>
          <TouchableOpacity onPress={handleClose} style={sigStyles.closeBtn} disabled={loading}>
            <Text style={sigStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={sigStyles.title}>Customer Signature</Text>
          <View style={{ width: 64 }} />
        </View>

        <Text style={sigStyles.instructions}>
          Ask the customer to sign below to confirm their approval.
        </Text>

        {/* Signature canvas
            - style={{ flex:1 }} makes the WebView fill the wrapper
            - No borderRadius/overflow:hidden on the wrapper: on Android, clipping a
              WebView container shifts its internal touch-coordinate origin, which is
              why only part of the canvas was reachable */}
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

        {/* Status hint */}
        <Text style={sigStyles.statusHint}>
          {hasSig ? '✓ Signature captured — tap Approve to confirm' : 'Draw signature above'}
        </Text>

        {/* Controls */}
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
                  <Text style={sigStyles.confirmBtnText}>Approve with Signature</Text>
                </>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:                '#6c757d',
  pending_approval:     '#f59e0b',
  sent:                 '#0ea5e9',
  viewed:               '#6366f1',
  approved:             '#22c55e',
  rejected:             '#ef4444',
  expired:              '#f59e0b',
  converted_to_wo:      '#10b981',
  converted_to_invoice: '#6366f1',
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  draft:                'document-outline',
  pending_approval:     'hourglass-outline',
  sent:                 'paper-plane-outline',
  viewed:               'eye-outline',
  approved:             'checkmark-circle-outline',
  rejected:             'close-circle-outline',
  expired:              'timer-outline',
  converted_to_wo:      'construct-outline',
  converted_to_invoice: 'receipt-outline',
};

function statusColor(s: string): string { return STATUS_COLORS[s] ?? colors.textLight; }

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: 'Draft', pending_approval: 'Pending Approval', sent: 'Sent', viewed: 'Viewed',
    approved: 'Approved', rejected: 'Rejected', expired: 'Expired',
    converted_to_wo: 'Converted to WO', converted_to_invoice: 'Invoiced',
  };
  return map[s] ?? s;
}

// ─── Item type config ─────────────────────────────────────────────────────────

const ITEM_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  service: 'briefcase-outline',
  part:    'cube-outline',
  travel:  'car-outline',
};

const ITEM_TYPE_COLORS: Record<string, string> = {
  service: '#6366f1',
  part:    '#0ea5e9',
  travel:  '#f59e0b',
};

// ─── Status pipeline (happy path) ─────────────────────────────────────────────

const PIPELINE = ['draft', 'sent', 'viewed', 'approved', 'converted_to_wo'] as const;

function StatusPipeline({ current }: { current: string }) {
  const terminalOff = current === 'rejected' || current === 'expired';
  const pipelineIdx = PIPELINE.indexOf(current as typeof PIPELINE[number]);

  return (
    <View>
      <View style={styles.pipeline}>
        {PIPELINE.map((step, idx) => {
          const done   = pipelineIdx > idx;
          const active = pipelineIdx === idx && !terminalOff;
          const col    = active ? statusColor(step)
                       : done  ? '#22c55e'
                       : colors.border;
          return (
            <View key={step} style={styles.pipelineStep}>
              {/* connector line (before each step except first) */}
              {idx > 0 && (
                <View style={[styles.pipelineLine, { backgroundColor: done ? '#22c55e' : colors.border }]} />
              )}
              <View style={[styles.pipelineDot, { backgroundColor: col, borderColor: col }]}>
                {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                {active && !done && <View style={styles.pipelinePulse} />}
              </View>
              <Text
                style={[
                  styles.pipelineLabel,
                  active && { color: col, fontWeight: '700' },
                  done && { color: '#22c55e' },
                ]}
                numberOfLines={1}
              >
                {statusLabel(step)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Off-pipeline state notice */}
      {terminalOff && (
        <View style={[styles.offPipelineBox, { borderLeftColor: statusColor(current) }]}>
          <Ionicons
            name={current === 'rejected' ? 'close-circle-outline' : 'timer-outline'}
            size={16}
            color={statusColor(current)}
          />
          <Text style={[styles.offPipelineText, { color: statusColor(current) }]}>
            {current === 'rejected'
              ? 'This estimate was rejected. It can be reverted to draft and re-sent.'
              : 'This estimate has expired. It can be reverted to draft and re-sent.'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon, label, value, valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

// ─── Line item row ────────────────────────────────────────────────────────────

function LineItemRow({ item }: { item: EstimateLineItem }) {
  const typeColor = ITEM_TYPE_COLORS[item.type] ?? colors.textSecondary;
  const icon = ITEM_TYPE_ICONS[item.type] ?? 'ellipsis-horizontal';

  return (
    <View style={styles.lineItem}>
      <View style={[styles.lineItemIcon, { backgroundColor: typeColor + '15' }]}>
        <Ionicons name={icon} size={16} color={typeColor} />
      </View>
      <View style={styles.lineItemBody}>
        <Text style={styles.lineItemName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.lineItemDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.lineItemCalc}>
          {item.quantity} × {formatCurrency(Number(item.unit_price))}
          {Number(item.tax_rate) > 0 ? ` + ${item.tax_rate}% tax` : ''}
          {Number(item.discount) > 0 ? ` − ${formatCurrency(Number(item.discount))}` : ''}
        </Text>
      </View>
      <Text style={styles.lineItemTotal}>{formatCurrency(Number(item.total))}</Text>
    </View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
  label, icon, onPress, variant = 'primary', loading,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}) {
  const bg      = variant === 'primary' ? ACCENT : 'transparent';
  const border  = variant === 'secondary' ? ACCENT : variant === 'danger' ? '#ef4444' : 'transparent';
  const textCol = variant === 'primary' ? '#fff' : variant === 'danger' ? '#ef4444' : ACCENT;

  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant !== 'primary' ? 1.5 : 0,
        },
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator size="small" color={textCol} />
        : <Ionicons name={icon} size={18} color={textCol} />}
      <Text style={[styles.actionBtnText, { color: textCol }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Expiry helper ────────────────────────────────────────────────────────────

function expiryBadge(dateStr: string | null): { label: string; color: string } | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  const diff = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: 'Expired', color: '#ef4444' };
  if (diff === 0) return { label: 'Expires today', color: '#f59e0b' };
  if (diff <= 3) return { label: `Expires in ${diff}d`, color: '#f59e0b' };
  return null; // Far-off expiry — not urgent
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EstimateDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [estimate, setEstimate]     = useState<Estimate | null>(null);
  const [lineItems, setLineItems]   = useState<EstimateLineItem[]>([]);
  const [contact, setContact]       = useState<Contact | null>(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [estRes, itemsRes] = await Promise.all([
        estimatesApi.getById(id),
        estimateLineItemsApi.getByEstimate(id),
      ]);
      const est = estRes.data.data ?? null;
      setEstimate(est);
      setLineItems(
        (itemsRes.data.data ?? []).sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        ),
      );
      // Resolve contact name if contact_id is present
      if (est?.contact_id) {
        contactsApi
          .getById(est.contact_id)
          .then((r) => setContact(r.data.data ?? null))
          .catch(() => {});
      }
    } catch {
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const confirm = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  };

  const doSend = () => {
    confirm('Send Estimate', 'Send this estimate to the customer?', async () => {
      setActionLoading('send');
      try {
        const res = await estimatesApi.send(id!);
        setEstimate(res.data.data ?? estimate);
        AuditLogger.log({
          action: AUDIT_ACTIONS.ESTIMATE_SENT,
          module: AUDIT_MODULES.ESTIMATES,
          record_id: id!,
          new_values: { estimate_id: id, status: 'sent' },
        });
      } catch {
        Alert.alert('Error', 'Could not send estimate. Please try again.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const doMarkViewed = () => {
    confirm('Mark as Viewed', 'Record that the customer has viewed this estimate?', async () => {
      setActionLoading('viewed');
      try {
        const res = await estimatesApi.updateStatus(id!, 'viewed');
        setEstimate(res.data.data ?? estimate);
      } catch {
        Alert.alert('Error', 'Could not update status.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const doApprove = () => {
    setSignatureModalVisible(true);
  };

  const handleSignatureConfirm = async (signature: string) => {
    setActionLoading('approve');
    try {
      const res = await estimatesApi.approve(id!, signature);
      setEstimate(res.data.data ?? estimate);
      setSignatureModalVisible(false);
      AuditLogger.log({
        action: AUDIT_ACTIONS.ESTIMATE_SIGNATURE,
        module: AUDIT_MODULES.ESTIMATES,
        record_id: id!,
        new_values: { estimate_id: id, status: 'approved', signature_captured: true },
      });
    } catch {
      Alert.alert('Error', 'Could not record approval. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const doReject = () => {
    Alert.alert(
      'Record Rejection',
      'Mark this estimate as rejected?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('reject');
            try {
              const res = await estimatesApi.reject(id!);
              setEstimate(res.data.data ?? estimate);
            } catch {
              Alert.alert('Error', 'Could not record rejection.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const doExpire = () => {
    confirm('Mark as Expired', 'Mark this estimate as expired?', async () => {
      setActionLoading('expired');
      try {
        const res = await estimatesApi.updateStatus(id!, 'expired');
        setEstimate(res.data.data ?? estimate);
      } catch {
        Alert.alert('Error', 'Could not update status.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const doRevertToDraft = () => {
    confirm('Revert to Draft', 'Revert this estimate back to draft?', async () => {
      setActionLoading('draft');
      try {
        const res = await estimatesApi.updateStatus(id!, 'draft');
        setEstimate(res.data.data ?? estimate);
      } catch {
        Alert.alert('Error', 'Could not revert to draft.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const doConvert = () => {
    confirm(
      'Convert to Work Order',
      'Create a work order from this approved estimate?',
      async () => {
        setActionLoading('convert');
        try {
          await estimatesApi.convertToWorkOrder(id!);
          // Reload to get the updated converted_to_wo status
          await load();
        } catch {
          Alert.alert('Error', 'Could not convert to work order.');
        } finally {
          setActionLoading(null);
        }
      },
    );
  };

  const doSubmitForApproval = () => {
    confirm('Submit for Approval', 'Submit this estimate for admin/dispatcher approval?', async () => {
      setActionLoading('submit');
      try {
        const res = await estimatesApi.submitForApproval(id!);
        setEstimate(res.data.data ?? estimate);
      } catch {
        Alert.alert('Error', 'Could not submit for approval.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const doAdminApprove = () => {
    confirm('Approve Estimate', 'Approve this estimate?', async () => {
      setActionLoading('admin-approve');
      try {
        const res = await estimatesApi.adminApprove(id!);
        setEstimate(res.data.data ?? estimate);
      } catch {
        Alert.alert('Error', 'Could not approve estimate.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  const doAdminReject = () => {
    Alert.alert(
      'Reject Estimate',
      'Reject this estimate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('admin-reject');
            try {
              const res = await estimatesApi.adminReject(id!);
              setEstimate(res.data.data ?? estimate);
            } catch {
              Alert.alert('Error', 'Could not reject estimate.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const doGenerateInvoice = () => {
    confirm('Generate Invoice', 'Create a draft invoice from this approved estimate?', async () => {
      setActionLoading('invoice');
      try {
        const res = await estimatesApi.generateInvoice(id!);
        const inv = res.data.data;
        // Reload estimate to reflect converted_to_invoice status
        await load();
        if (inv?.id) {
          router.push(`/invoices/${inv.id}` as `/${string}`);
        }
      } catch {
        Alert.alert('Error', 'Could not generate invoice.');
      } finally {
        setActionLoading(null);
      }
    });
  };

  // ── Render: loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!estimate) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="document-text-outline" size={48} color={c.textLight} />
        <Text style={[styles.errorTitle, { color: c.text }]}>Estimate not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const sColor   = statusColor(estimate.status);
  const sIcon    = STATUS_ICONS[estimate.status] ?? 'document-outline';
  const isFinal  = estimate.status === 'converted_to_wo' || estimate.status === 'converted_to_invoice';
  const canAct   = !isFinal;
  const expiry   = expiryBadge(estimate.expiry_date);
  const contactName = contact
    ? `${contact.first_name} ${contact.last_name}`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Signature capture modal (estimate approval) */}
      <SignatureCaptureModal
        visible={signatureModalVisible}
        onClose={() => setSignatureModalVisible(false)}
        onConfirm={handleSignatureConfirm}
        loading={actionLoading === 'approve'}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>Estimate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['3xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: cardBg, borderColor }]}>
          {/* Badges row */}
          <View style={styles.heroBadges}>
            <View style={[styles.statusBadge, { backgroundColor: sColor + '18', borderColor: sColor + '40' }]}>
              <Ionicons name={sIcon} size={13} color={sColor} />
              <Text style={[styles.statusBadgeText, { color: sColor }]}>
                {statusLabel(estimate.status)}
              </Text>
            </View>
            {expiry && (
              <View style={[styles.expiryBadge, { backgroundColor: expiry.color + '18' }]}>
                <Ionicons name="timer-outline" size={12} color={expiry.color} />
                <Text style={[styles.expiryBadgeText, { color: expiry.color }]}>
                  {expiry.label}
                </Text>
              </View>
            )}
          </View>

          {/* Estimate number */}
          <Text style={styles.heroNumber}>
            {estimate.estimate_number ?? 'Draft Estimate'}
          </Text>

          {/* Contact */}
          {contactName && (
            <View style={styles.heroContact}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.heroContactText}>{contactName}</Text>
            </View>
          )}

          {/* Date + total */}
          <View style={styles.heroFooter}>
            <Text style={styles.heroDate}>{formatDate(estimate.created_at)}</Text>
            <Text style={styles.heroTotal}>{formatCurrency(Number(estimate.total))}</Text>
          </View>
        </View>

        {/* ── Status pipeline ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Progress</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <StatusPipeline current={estimate.status} />
          </View>
        </View>

        {/* ── Line items ────────────────────────────────────────────────────── */}
        {lineItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
              Line Items ({lineItems.length})
            </Text>
            <View style={[styles.card, styles.cardNoPadV, { backgroundColor: cardBg, borderColor }]}>
              {lineItems.map((item, idx) => (
                <View key={item.id}>
                  <LineItemRow item={item} />
                  {idx < lineItems.length - 1 && (
                    <View style={styles.lineItemSep} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Financials ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Financials</Text>
          <View style={[styles.card, styles.financialsCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.finRow}>
              <Text style={styles.finLabel}>Subtotal</Text>
              <Text style={styles.finVal}>{formatCurrency(Number(estimate.subtotal))}</Text>
            </View>
            {Number(estimate.discount) > 0 && (
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Discount</Text>
                <Text style={[styles.finVal, { color: '#22c55e' }]}>
                  −{formatCurrency(Number(estimate.discount))}
                </Text>
              </View>
            )}
            {Number(estimate.tax) > 0 && (
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Tax</Text>
                <Text style={styles.finVal}>+{formatCurrency(Number(estimate.tax))}</Text>
              </View>
            )}
            <View style={[styles.finRow, styles.finRowTotal]}>
              <Text style={styles.finLabelTotal}>Total</Text>
              <Text style={styles.finValTotal}>{formatCurrency(Number(estimate.total))}</Text>
            </View>
          </View>
        </View>

        {/* ── Details ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Details</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {estimate.expiry_date && (
              <>
                <InfoRow
                  icon="calendar-outline"
                  label="Expiry Date"
                  value={formatDate(estimate.expiry_date)}
                  valueColor={expiry?.color}
                />
                {estimate.notes && <RowDivider />}
              </>
            )}
            {estimate.notes ? (
              <View style={styles.notesRow}>
                <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.notesText}>{estimate.notes}</Text>
              </View>
            ) : null}
            {!estimate.expiry_date && !estimate.notes && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textLight, textAlign: 'center', flex: 1, paddingVertical: spacing.sm }]}>
                  No details set
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        {contact && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Contact</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <InfoRow
                icon="person-outline"
                label="Name"
                value={`${contact.first_name} ${contact.last_name}`}
              />
              {contact.email && (
                <>
                  <RowDivider />
                  <InfoRow icon="mail-outline" label="Email" value={contact.email} />
                </>
              )}
              {contact.phone && (
                <>
                  <RowDivider />
                  <InfoRow icon="call-outline" label="Phone" value={contact.phone} />
                </>
              )}
            </View>
          </View>
        )}

        {/* ── Record info ───────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Record Info</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <InfoRow icon="calendar-outline" label="Created" value={formatDateTime(estimate.created_at)} />
            <RowDivider />
            <InfoRow icon="time-outline" label="Updated" value={formatDateTime(estimate.updated_at)} />
          </View>
        </View>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        {canAct && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Actions</Text>
            <View style={styles.actionsWrap}>

              {/* DRAFT → send or submit for approval */}
              {estimate.status === 'draft' && (
                <>
                  <ActionButton
                    label="Send to Customer"
                    icon="paper-plane-outline"
                    onPress={doSend}
                    loading={actionLoading === 'send'}
                  />
                  <ActionButton
                    label="Submit for Approval"
                    icon="hourglass-outline"
                    onPress={doSubmitForApproval}
                    variant="secondary"
                    loading={actionLoading === 'submit'}
                  />
                </>
              )}

              {/* PENDING_APPROVAL → admin approve or reject */}
              {estimate.status === 'pending_approval' && (
                <>
                  <ActionButton
                    label="Approve"
                    icon="checkmark-circle-outline"
                    onPress={doAdminApprove}
                    loading={actionLoading === 'admin-approve'}
                  />
                  <ActionButton
                    label="Reject"
                    icon="close-circle-outline"
                    onPress={doAdminReject}
                    variant="danger"
                    loading={actionLoading === 'admin-reject'}
                  />
                </>
              )}

              {/* SENT → viewed or expire */}
              {estimate.status === 'sent' && (
                <>
                  <ActionButton
                    label="Mark as Viewed"
                    icon="eye-outline"
                    onPress={doMarkViewed}
                    variant="secondary"
                    loading={actionLoading === 'viewed'}
                  />
                  <ActionButton
                    label="Mark as Expired"
                    icon="timer-outline"
                    onPress={doExpire}
                    variant="secondary"
                    loading={actionLoading === 'expired'}
                  />
                </>
              )}

              {/* VIEWED → approve, reject, or expire */}
              {estimate.status === 'viewed' && (
                <>
                  <ActionButton
                    label="Record Approval"
                    icon="checkmark-circle-outline"
                    onPress={doApprove}
                    loading={actionLoading === 'approve'}
                  />
                  <ActionButton
                    label="Mark as Expired"
                    icon="timer-outline"
                    onPress={doExpire}
                    variant="secondary"
                    loading={actionLoading === 'expired'}
                  />
                  <ActionButton
                    label="Record Rejection"
                    icon="close-circle-outline"
                    onPress={doReject}
                    variant="danger"
                    loading={actionLoading === 'reject'}
                  />
                </>
              )}

              {/* APPROVED → convert to WO or generate invoice */}
              {estimate.status === 'approved' && (
                <>
                  <ActionButton
                    label="Generate Invoice"
                    icon="receipt-outline"
                    onPress={doGenerateInvoice}
                    loading={actionLoading === 'invoice'}
                  />
                  <ActionButton
                    label="Convert to Work Order"
                    icon="construct-outline"
                    onPress={doConvert}
                    variant="secondary"
                    loading={actionLoading === 'convert'}
                  />
                </>
              )}

              {/* REJECTED or EXPIRED → revert to draft */}
              {(estimate.status === 'rejected' || estimate.status === 'expired') && (
                <ActionButton
                  label="Revert to Draft"
                  icon="refresh-outline"
                  onPress={doRevertToDraft}
                  variant="secondary"
                  loading={actionLoading === 'draft'}
                />
              )}

            </View>
          </View>
        )}

        {/* ── Final state notice ────────────────────────────────────────────── */}
        {isFinal && (
          <View style={[styles.finalNotice, { borderLeftColor: sColor, backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="checkmark-circle" size={18} color={sColor} />
            <Text style={[styles.finalNoticeText, { color: sColor }]}>
              {estimate.status === 'converted_to_invoice'
                ? 'This estimate has been invoiced and cannot be modified.'
                : 'This estimate has been converted to a work order and cannot be modified.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },

  // ── Loading / error ────────────────────────────────────────────────────────
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F9FB', gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: { ...typography.h4, color: colors.text },
  errorBack: { marginTop: spacing.sm },
  errorBackText: { ...typography.body, color: ACCENT, fontWeight: '600' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { ...typography.h4, color: colors.text, flex: 1, textAlign: 'center' },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  content: { padding: spacing.lg },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: borderRadius.full, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  statusBadgeText: { ...typography.bodySmall, fontWeight: '700' },
  expiryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  expiryBadgeText: { fontSize: 11, fontWeight: '600' },
  heroNumber: { ...typography.h3, color: colors.text, fontWeight: '700' },
  heroContact: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  heroContactText: { ...typography.body, color: colors.textSecondary },
  heroFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs,
  },
  heroDate: { ...typography.bodySmall, color: colors.textLight },
  heroTotal: { ...typography.h4, color: ACCENT, fontWeight: '700' },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#FFF', borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#E2E8F0',
  },
  cardNoPadV: { paddingHorizontal: 0 },

  // ── Info row ──────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, gap: spacing.sm,
  },
  infoIcon: { width: 20, textAlign: 'center' },
  infoLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  infoValue: {
    ...typography.body, color: colors.text, fontWeight: '500',
    textAlign: 'right', maxWidth: '55%',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 20 + spacing.sm,
  },
  notesRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: spacing.md, gap: spacing.sm,
  },
  notesText: {
    ...typography.body, color: colors.text, flex: 1, lineHeight: 22,
    textAlign: 'right',
  },

  // ── Status pipeline ───────────────────────────────────────────────────────
  pipeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  pipelineStep: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  pipelineDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  pipelinePulse: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff',
  },
  pipelineLine: {
    position: 'absolute',
    top: 10,
    left: '-50%',
    right: '50%',
    height: 2,
    zIndex: 0,
  },
  pipelineLabel: {
    ...typography.caption, color: colors.textLight,
    textAlign: 'center', fontSize: 9,
  },
  offPipelineBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    borderLeftWidth: 4, borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    padding: spacing.md, margin: spacing.md, marginTop: 0,
  },
  offPipelineText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },

  // ── Line items ────────────────────────────────────────────────────────────
  lineItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.sm, padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lineItemIcon: {
    width: 34, height: 34, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    marginTop: 2,
  },
  lineItemBody: { flex: 1, gap: 2 },
  lineItemName: { ...typography.body, fontWeight: '600', color: colors.text },
  lineItemDesc: { ...typography.caption, color: colors.textSecondary },
  lineItemCalc: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  lineItemTotal: {
    ...typography.body, fontWeight: '700', color: colors.text,
    flexShrink: 0, paddingTop: 2,
  },
  lineItemSep: {
    height: StyleSheet.hairlineWidth, backgroundColor: colors.divider,
    marginLeft: spacing.lg + 34 + spacing.sm,
  },

  // ── Financials ────────────────────────────────────────────────────────────
  financialsCard: { paddingHorizontal: spacing.lg },
  finRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  finRowTotal: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider,
    marginTop: spacing.xs, paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  finLabel: { ...typography.body, color: colors.textSecondary },
  finVal: { ...typography.body, color: colors.text, fontWeight: '600' },
  finLabelTotal: { ...typography.h4, color: colors.text },
  finValTotal: { ...typography.h4, color: ACCENT, fontWeight: '700' },

  // ── Actions ───────────────────────────────────────────────────────────────
  actionsWrap: { gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: 10,
    height: 52,
  },
  actionBtnText: { ...typography.button },

  // ── Final notice ──────────────────────────────────────────────────────────
  finalNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: '#FFF', borderRadius: borderRadius.md,
    borderLeftWidth: 4, padding: spacing.md, borderWidth: 1, borderColor: '#E2E8F0',
  },
  finalNoticeText: { ...typography.body, flex: 1, lineHeight: 20 },
});

// ─── Signature modal styles ────────────────────────────────────────────────────

const sigStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeBtn: { minWidth: 64 },
  closeBtnText: { ...typography.body, color: ACCENT },

  title: { ...typography.h3, color: colors.text },
  instructions: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  canvasWrapper: {
    // flex:1 lets this fill all remaining vertical space between the instructions
    // and controls. DO NOT add borderRadius + overflow:hidden here — on Android it
    // shifts the WebView's internal touch-coordinate origin and makes part of the
    // canvas unreachable. Use borderWidth only for the visual outline.
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  statusHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 18,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  clearBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { ...typography.button, color: colors.textSecondary },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { ...typography.button, color: '#fff' },
});
