import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { invoicesApi, paymentsApi } from '@/api/endpoints';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Invoice, Payment } from '@/types/models';

const ACCENT = '#4F6BF6';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  online: 'Online',
  check: 'Check',
  other: 'Other',
};

export default function PaymentReceiptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { paymentId, invoiceId } = useLocalSearchParams<{ paymentId: string; invoiceId: string }>();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId || !invoiceId) return;

    const load = async () => {
      try {
        const [pmtRes, invRes] = await Promise.all([
          paymentsApi.getById(paymentId),
          invoicesApi.getById(invoiceId),
        ]);
        setPayment(pmtRes.data.data ?? null);
        setInvoice(invRes.data.data ?? null);
      } catch {
        // Keep null — handled in render
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paymentId, invoiceId]);

  const handleShare = async () => {
    if (!payment || !invoice) return;

    const lines = [
      '--- Payment Receipt ---',
      `Invoice: ${invoice.invoice_number}`,
      `Amount Paid: ${formatCurrency(payment.amount, invoice.currency)}`,
      `Method: ${PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}`,
      payment.gateway_transaction_id
        ? `Transaction ID: ${payment.gateway_transaction_id}`
        : null,
      `Date: ${formatDateTime(payment.paid_at)}`,
      '----------------------',
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({ message: lines });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!payment || !invoice) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="alert-circle-outline" size={56} color={c.textLight} />
        <Text style={[styles.errorText, { color: c.textSecondary }]}>Receipt not available</Text>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)/home')}>
          <Text style={[styles.doneButtonText, { color: c.textInverse }]}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing['3xl'], backgroundColor: isDark ? c.background : '#F8F9FB' },
      ]}
    >
      {/* Success icon */}
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={88} color={c.success} />
      </View>
      <Text style={[styles.heading, { color: c.text }]}>Payment Received</Text>
      <Text style={[styles.subheading, { color: c.textSecondary }]}>Transaction completed successfully</Text>

      {/* Receipt card */}
      <View style={[styles.receiptCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: c.textSecondary }]}>Invoice</Text>
          <Text style={[styles.receiptValue, { color: c.text }]}>{invoice.invoice_number}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: c.divider }]} />

        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: c.textSecondary }]}>Amount Paid</Text>
          <Text style={[styles.receiptValue, styles.amountText, { color: c.success }]}>
            {formatCurrency(payment.amount, invoice.currency)}
          </Text>
        </View>

        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: c.textSecondary }]}>Method</Text>
          <Text style={[styles.receiptValue, { color: c.text }]}>
            {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
          </Text>
        </View>

        {payment.gateway_transaction_id && (
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: c.textSecondary }]}>Transaction ID</Text>
            <Text style={[styles.receiptValue, styles.transactionId, { color: c.text }]} numberOfLines={1}>
              {payment.gateway_transaction_id}
            </Text>
          </View>
        )}

        <View style={styles.receiptRow}>
          <Text style={[styles.receiptLabel, { color: c.textSecondary }]}>Date &amp; Time</Text>
          <Text style={[styles.receiptValue, { color: c.text }]}>{formatDateTime(payment.paid_at)}</Text>
        </View>

        {/* Balance remaining */}
        {invoice.total - invoice.paid_amount > 0 && (
          <>
            <View style={[styles.divider, { backgroundColor: c.divider }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: c.warning }]}>Balance Remaining</Text>
              <Text style={[styles.receiptValue, { color: c.warning }]}>
                {formatCurrency(invoice.total - invoice.paid_amount, invoice.currency)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-outline" size={20} color={ACCENT} />
        <Text style={styles.shareButtonText}>Share Receipt</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.invoiceButton}
        onPress={() => router.replace(`/invoice/${invoiceId}`)}
      >
        <Text style={[styles.invoiceButtonText, { color: c.textSecondary }]}>Back to Invoice</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={[styles.doneButtonText, { color: c.textInverse }]}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: spacing.xl,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subheading: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  receiptCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  receiptValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    flexShrink: 1,
    marginLeft: spacing.md,
    textAlign: 'right',
  },
  amountText: {
    ...typography.h4,
    color: colors.success,
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: 12,
    maxWidth: 180,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    marginBottom: spacing.sm,
  },
  shareButtonText: {
    ...typography.button,
    color: ACCENT,
  },
  invoiceButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  invoiceButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  doneButton: {
    backgroundColor: ACCENT,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
