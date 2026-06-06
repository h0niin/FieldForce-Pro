import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { invoicesApi, paymentsApi, invoiceLineItemsApi } from '@/api/endpoints';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SignatureCaptureModal } from '@/components/SignatureCaptureModal';
import { TenantPaymentDetails } from '@/components/TenantPaymentDetails';
import type { Invoice, Payment } from '@/types/models';

const ACCENT = '#4F6BF6';

// ── Invoice status colors ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: colors.textSecondary,
  sent: colors.info,
  viewed: colors.info,
  partially_paid: colors.warning,
  paid: colors.success,
  overdue: colors.error,
  void: colors.textLight,
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
  check: 'Check',
  other: 'Other',
};

// ── Helper components ─────────────────────────────────────────────────────────

function SectionHeader({ title, color }: { title: string; color?: string }) {
  return <Text style={[styles.sectionHeader, color ? { color } : undefined]}>{title}</Text>;
}

function InfoRow({ label, value, labelColor, valueColor }: { label: string; value: string; labelColor?: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, labelColor ? { color: labelColor } : undefined]}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function InvoiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [invRes, pmtRes, liRes] = await Promise.all([
        invoicesApi.getById(id),
        paymentsApi.getByInvoice(id),
        invoiceLineItemsApi.getByInvoice(id),
      ]);
      const inv = invRes.data.data ?? null;
      // The invoice endpoint doesn't eager-load line items; merge them in from
      // the dedicated endpoint so the detail view shows the full breakdown.
      if (inv) inv.line_items = liRes.data.data ?? [];
      setInvoice(inv);
      setPayments(pmtRes.data.data ?? []);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSendInvoice = async () => {
    if (!invoice) return;
    Alert.alert(
      'Send Invoice',
      `Mark invoice ${invoice.invoice_number} as sent to the customer?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const res = await invoicesApi.updateStatus(invoice.id, 'sent');
              setInvoice(res.data.data ?? invoice);
              Alert.alert('Sent', 'Invoice has been marked as sent to the customer.');
            } catch {
              Alert.alert('Error', 'Failed to send invoice. Please try again.');
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  const handleRecordPayment = () => {
    if (!invoice) return;
    const balance = invoice.total - invoice.paid_amount;
    Alert.alert(
      'Record Payment',
      `Record a payment for ${formatCurrency(balance, invoice.currency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cash',
          onPress: () => recordPayment('cash', balance),
        },
        {
          text: 'Card (Terminal)',
          onPress: () => {
            if (invoice.work_order_id) {
              // Navigate to Stripe Terminal payment screen via appointment
              Alert.alert(
                'Card Payment',
                'To collect card payment via terminal, open the appointment and use the payment button.',
              );
            } else {
              recordPayment('card', balance);
            }
          },
        },
      ],
    );
  };

  const recordPayment = async (method: string, amount: number) => {
    if (!invoice) return;
    setRecordingPayment(true);
    try {
      const res = await paymentsApi.create({
        invoice_id: invoice.id,
        amount,
        method,
        notes: `Payment recorded on ${new Date().toLocaleDateString()}`,
      });
      const newPayment = res.data.data;
      if (newPayment) {
        // Refresh invoice (paid_amount + status updated by server)
        await fetchData();
        router.push(`/invoice/receipt?paymentId=${newPayment.id}&invoiceId=${invoice.id}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // ── Customer signature (Step 7) ─────────────────────────────────────────────
  const handleSaveSignature = async (sig: string) => {
    if (!invoice) return;
    setSavingSignature(true);
    try {
      await invoicesApi.saveSignature(invoice.id, sig);
      setShowSignatureModal(false);
      await fetchData();
    } catch {
      Alert.alert('Error', 'Could not save the signature. Please try again.');
    } finally {
      setSavingSignature(false);
    }
  };

  // ── Submit for approval (Step 8) ────────────────────────────────────────────
  const handleSubmitForApproval = async () => {
    if (!invoice) return;
    setSubmittingApproval(true);
    try {
      await invoicesApi.submitForApproval(invoice.id);
      await fetchData();
      Alert.alert('Submitted', 'The invoice has been sent for approval.');
    } catch (err: any) {
      Alert.alert('Could not submit', err?.response?.data?.message ?? 'Please try again.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    const balance = invoice.total - invoice.paid_amount;
    const shareText = [
      `Invoice ${invoice.invoice_number}`,
      `Status: ${invoice.status.replace('_', ' ').toUpperCase()}`,
      `Total: ${formatCurrency(invoice.total, invoice.currency)}`,
      `Paid: ${formatCurrency(invoice.paid_amount, invoice.currency)}`,
      balance > 0 ? `Balance Due: ${formatCurrency(balance, invoice.currency)}` : 'Fully Paid',
      invoice.due_date ? `Due: ${formatDate(invoice.due_date)}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({ message: shareText });
  };

  // ── Render states ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="alert-circle-outline" size={56} color={c.textLight} />
        <Text style={[styles.notFoundText, { color: c.textSecondary }]}>Invoice not found</Text>
      </View>
    );
  }

  const balance = invoice.total - invoice.paid_amount;
  const statusColor = STATUS_COLORS[invoice.status] ?? colors.textSecondary;
  const canSend = invoice.status === 'approved' || invoice.status === 'draft';
  const canPay = balance > 0 && ['approved', 'sent', 'viewed', 'partially_paid', 'overdue'].includes(invoice.status);
  // A draft can have a signature captured, then be submitted into the approval chain.
  const canSign = invoice.status === 'draft';
  const canSubmitForApproval = invoice.status === 'draft' && !!invoice.signature_url;

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status header ── */}
        <View style={[styles.statusHeader, { borderLeftColor: statusColor, backgroundColor: cardBg, borderColor }]}>
          <View>
            <Text style={[styles.invoiceNumber, { color: c.text }]}>{invoice.invoice_number}</Text>
            {invoice.due_date && (
              <Text style={[styles.dueDate, { color: c.textSecondary }]}>Due {formatDate(invoice.due_date)}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {invoice.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Financial summary ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <SectionHeader title="SUMMARY" color={c.textSecondary} />
          <InfoRow label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} labelColor={c.textSecondary} valueColor={c.text} />
          {invoice.tax > 0 && (
            <InfoRow label="Tax" value={formatCurrency(invoice.tax, invoice.currency)} labelColor={c.textSecondary} valueColor={c.text} />
          )}
          {invoice.discount > 0 && (
            <InfoRow label="Discount" value={`-${formatCurrency(invoice.discount, invoice.currency)}`} labelColor={c.textSecondary} valueColor={c.text} />
          )}
          <View style={[styles.divider, { backgroundColor: c.divider }]} />
          <InfoRow label="Total" value={formatCurrency(invoice.total, invoice.currency)} labelColor={c.textSecondary} valueColor={c.text} />
          <InfoRow label="Paid" value={formatCurrency(invoice.paid_amount, invoice.currency)} labelColor={c.textSecondary} valueColor={c.text} />
          {balance > 0 && (
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: c.error }]}>Balance Due</Text>
              <Text style={[styles.balanceValue, { color: c.error }]}>{formatCurrency(balance, invoice.currency)}</Text>
            </View>
          )}
          {balance <= 0 && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={16} color={c.success} />
              <Text style={[styles.paidBadgeText, { color: c.success }]}>Fully Paid</Text>
            </View>
          )}
        </View>

        {/* ── Details ── */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <SectionHeader title="DETAILS" color={c.textSecondary} />
          {invoice.work_order_id && (
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push(`/work-order/${invoice.work_order_id}`)}
            >
              <Ionicons name="document-text-outline" size={16} color={ACCENT} />
              <Text style={styles.linkText}>View Work Order</Text>
              <Ionicons name="chevron-forward" size={16} color={c.textLight} />
            </TouchableOpacity>
          )}
          {invoice.notes && (
            <View style={[styles.notesBox, { backgroundColor: isDark ? c.surface : colors.surface }]}>
              <Text style={[styles.notesLabel, { color: c.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: c.text }]}>{invoice.notes}</Text>
            </View>
          )}
          <InfoRow label="Currency" value={invoice.currency} labelColor={c.textSecondary} valueColor={c.text} />
          <InfoRow label="Created" value={formatDate(invoice.created_at)} labelColor={c.textSecondary} valueColor={c.text} />
        </View>

        {/* ── Line items ── */}
        {invoice.line_items && invoice.line_items.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <SectionHeader title="LINE ITEMS" color={c.textSecondary} />
            {invoice.line_items.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: c.divider }]} />}
                <View style={styles.lineItem}>
                  <View style={styles.lineItemLeft}>
                    <Text style={[styles.lineItemName, { color: c.text }]}>{item.name}</Text>
                    {item.description && (
                      <Text style={[styles.lineItemDesc, { color: c.textSecondary }]}>{item.description}</Text>
                    )}
                    <Text style={[styles.lineItemQty, { color: c.textSecondary }]}>
                      {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                    </Text>
                  </View>
                  <Text style={[styles.lineItemTotal, { color: c.text }]}>
                    {formatCurrency(item.total, invoice.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Payment history ── */}
        {payments.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <SectionHeader title="PAYMENT HISTORY" color={c.textSecondary} />
            {payments.map((p, idx) => (
              <View key={p.id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: c.divider }]} />}
                <View style={styles.paymentItem}>
                  <View style={styles.paymentItemLeft}>
                    <Ionicons name="card-outline" size={16} color={c.success} />
                    <View>
                      <Text style={[styles.paymentMethod, { color: c.text }]}>
                        {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                      </Text>
                      <Text style={[styles.paymentDate, { color: c.textSecondary }]}>{formatDateTime(p.paid_at)}</Text>
                    </View>
                  </View>
                  <Text style={[styles.paymentAmount, { color: c.success }]}>
                    {formatCurrency(p.amount, invoice.currency)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Customer signature ── */}
        {(invoice.signature_url || canSign) && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <SectionHeader title="CUSTOMER SIGNATURE" color={c.textSecondary} />
            {invoice.signature_url ? (
              <View style={{ gap: spacing.sm, paddingTop: spacing.sm }}>
                <Image
                  source={{ uri: invoice.signature_url }}
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
                {invoice.signed_at ? (
                  <Text style={[styles.signedMeta, { color: c.textSecondary }]}>
                    Signed {formatDateTime(invoice.signed_at)}
                    {invoice.signed_by_name ? ` · ${invoice.signed_by_name}` : ''}
                  </Text>
                ) : null}
                {canSign && (
                  <TouchableOpacity onPress={() => setShowSignatureModal(true)}>
                    <Text style={styles.secondaryButtonText}>Re-capture signature</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton, { marginTop: spacing.sm }]}
                onPress={() => setShowSignatureModal(true)}
              >
                <Ionicons name="create-outline" size={18} color={ACCENT} />
                <Text style={styles.secondaryButtonText}>Capture Customer Signature</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Collect payment: show tenant QR / payment details to the customer ── */}
        {canPay && (
          <View style={{ marginBottom: spacing.md }}>
            <TenantPaymentDetails amount={balance} note={invoice.invoice_number} />
          </View>
        )}

        {/* ── Actions ── */}
        <View style={styles.actionsCard}>
          {canSubmitForApproval && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSubmitForApproval}
              disabled={submittingApproval}
            >
              {submittingApproval ? (
                <ActivityIndicator size="small" color={c.textInverse} />
              ) : (
                <Ionicons name="send-outline" size={18} color={c.textInverse} />
              )}
              <Text style={[styles.primaryButtonText, { color: c.textInverse }]}>Submit for Approval</Text>
            </TouchableOpacity>
          )}

          {canSend && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSendInvoice}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={c.textInverse} />
              ) : (
                <Ionicons name="send-outline" size={18} color={c.textInverse} />
              )}
              <Text style={[styles.primaryButtonText, { color: c.textInverse }]}>Send Invoice</Text>
            </TouchableOpacity>
          )}

          {canPay && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleRecordPayment}
              disabled={recordingPayment}
            >
              {recordingPayment ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : (
                <Ionicons name="cash-outline" size={18} color={ACCENT} />
              )}
              <Text style={styles.secondaryButtonText}>Record Payment</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.outlineButton, { borderColor: c.border }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color={c.text} />
            <Text style={[styles.outlineButtonText, { color: c.text }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SignatureCaptureModal
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={handleSaveSignature}
        loading={savingSignature}
        title="Customer Signature"
        instructions="Show the invoice to the customer and ask them to sign below."
        confirmLabel="Save Signature"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#F8F9FB',
  },
  notFoundText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  // ── Status header
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceNumber: {
    ...typography.h3,
    color: colors.text,
  },
  dueDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    ...typography.label,
    fontWeight: '700',
    fontSize: 11,
  },

  // ── Cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },

  // ── Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },

  // ── Balance
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  balanceLabel: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  balanceValue: {
    ...typography.h4,
    color: colors.error,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  paidBadgeText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },

  // ── Link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  linkText: {
    ...typography.body,
    color: ACCENT,
    flex: 1,
  },

  // ── Notes
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  notesLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },

  // ── Line items
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  lineItemLeft: {
    flex: 1,
    marginRight: spacing.md,
    gap: spacing.xs,
  },
  lineItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  lineItemDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  lineItemQty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  lineItemTotal: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },

  // ── Payment history
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  paymentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentMethod: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  paymentDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  paymentAmount: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },

  // ── Action buttons
  actionsCard: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: ACCENT,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryButton: {
    backgroundColor: ACCENT + '15',
  },
  secondaryButtonText: {
    ...typography.button,
    color: ACCENT,
  },
  signatureImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  signedMeta: {
    ...typography.caption,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButtonText: {
    ...typography.button,
    color: colors.text,
  },
});
