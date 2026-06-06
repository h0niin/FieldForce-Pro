import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tenantPaymentApi, type TenantPaymentConfig } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';

const ACCENT = '#4F6BF6';

/**
 * Shows the tenant's payment details to the customer so they can pay the
 * technician (Step 12). Priority:
 *   1. Tenant-uploaded QR image (any provider) — fully scannable, offline-safe.
 *   2. UPI VPA — renders a scannable UPI QR + a "Pay via UPI app" deep link.
 * Bank details and instructions are shown as text when present.
 *
 * `amount` (optional) is embedded into the generated UPI QR / deep link.
 */
export function TenantPaymentDetails({ amount, note }: { amount?: number; note?: string }) {
  const [config, setConfig] = useState<TenantPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tenantPaymentApi
      .getPaymentSettings()
      .then((res) => setConfig(res.data.data ?? {}))
      .catch(() => setConfig({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={ACCENT} />
      </View>
    );
  }

  const hasUpi = !!config?.upi_vpa;
  const hasImage = !!config?.qr_image_url;
  const hasBank = !!(config?.bank_account_number || config?.bank_account_name);
  if (!config || (!hasUpi && !hasImage && !hasBank && !config.instructions)) {
    return null;
  }

  // Build the UPI deep link / QR payload.
  const upiUri = hasUpi
    ? `upi://pay?pa=${encodeURIComponent(config.upi_vpa!)}` +
      (config.upi_name ? `&pn=${encodeURIComponent(config.upi_name)}` : '') +
      (amount && amount > 0 ? `&am=${amount.toFixed(2)}&cu=INR` : '') +
      (note ? `&tn=${encodeURIComponent(note)}` : '')
    : '';

  // Primary: uploaded image. Fallback: a QR rendered from the UPI URI.
  const qrSource = hasImage
    ? config.qr_image_url!
    : hasUpi
      ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUri)}`
      : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>SCAN TO PAY</Text>

      {qrSource ? (
        <Image source={{ uri: qrSource }} style={styles.qr} resizeMode="contain" />
      ) : null}

      {hasUpi ? (
        <>
          <Text style={styles.payee}>{config.upi_name || 'Pay to'}</Text>
          <Text style={styles.vpa}>{config.upi_vpa}</Text>
          <TouchableOpacity
            style={styles.upiBtn}
            onPress={() => Linking.openURL(upiUri).catch(() => {})}
            activeOpacity={0.8}
          >
            <Ionicons name="phone-portrait-outline" size={16} color="#fff" />
            <Text style={styles.upiBtnText}>Pay via UPI app</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {hasBank ? (
        <View style={styles.bankBox}>
          <Text style={styles.bankTitle}>Bank Transfer</Text>
          {config.bank_account_name ? <Text style={styles.bankLine}>A/C Name: {config.bank_account_name}</Text> : null}
          {config.bank_account_number ? <Text style={styles.bankLine}>A/C No: {config.bank_account_number}</Text> : null}
          {config.bank_ifsc ? <Text style={styles.bankLine}>IFSC: {config.bank_ifsc}</Text> : null}
          {config.bank_name ? <Text style={styles.bankLine}>Bank: {config.bank_name}</Text> : null}
        </View>
      ) : null}

      {config.instructions ? <Text style={styles.instructions}>{config.instructions}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.label, color: colors.textSecondary, letterSpacing: 0.5 },
  qr: { width: 220, height: 220, borderRadius: borderRadius.md, backgroundColor: '#fff' },
  payee: { ...typography.body, color: colors.text, fontWeight: '700' },
  vpa: { ...typography.bodySmall, color: colors.textSecondary },
  upiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: ACCENT, borderRadius: borderRadius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.xs,
  },
  upiBtnText: { ...typography.button, color: '#fff' },
  bankBox: {
    alignSelf: 'stretch', marginTop: spacing.sm, padding: spacing.md,
    backgroundColor: '#F8F9FB', borderRadius: borderRadius.md, gap: 2,
  },
  bankTitle: { ...typography.bodySmall, color: colors.text, fontWeight: '700', marginBottom: 2 },
  bankLine: { ...typography.bodySmall, color: colors.textSecondary },
  instructions: { ...typography.caption, color: colors.textLight, textAlign: 'center', marginTop: spacing.xs },
});
