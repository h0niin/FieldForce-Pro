import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { servicesCatalogApi } from '@/api/endpoints';
import { formatCurrency, formatDuration, formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ServiceCatalogItem } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryColor(category: string | null): string {
  if (!category) return ACCENT;
  const palette = [
    '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon, label, value, highlight, themeColors,
}: {
  icon: string; label: string; value: string; highlight?: boolean;
  themeColors: { textSecondary: string; text: string };
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={themeColors.textSecondary} />
      <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: themeColors.text }, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

function MetaRow({ label, value, themeColors }: { label: string; value: string; themeColors: { textSecondary: string; text: string } }) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, { color: themeColors.textSecondary }]}>{label}</Text>
      <Text style={[styles.metaValue, { color: themeColors.text }]}>{value}</Text>
    </View>
  );
}

function Divider({ dividerColor }: { dividerColor?: string }) {
  return <View style={[styles.divider, dividerColor ? { backgroundColor: dividerColor } : undefined]} />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ServiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [service, setService] = useState<ServiceCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      servicesCatalogApi
        .getById(id)
        .then((res) => setService(res.data.data ?? null))
        .catch(() => setService(null))
        .finally(() => setLoading(false));
    }, [id]),
  );

  if (loading) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <View style={styles.centered}>
          <Ionicons name="construct-outline" size={48} color={c.textLight} />
          <Text style={[styles.notFoundText, { color: c.textSecondary }]}>Service not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColor = categoryColor(service.category);
  const totalRate =
    service.default_price != null && service.tax_rate != null
      ? Number(service.default_price) * (1 + Number(service.tax_rate) / 100)
      : null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* ── Fixed Header ───────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
          {service.name}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace(`/catalog/services/edit?id=${id}`)}
          style={styles.editPill}
          activeOpacity={0.75}
        >
          <Ionicons name="pencil-outline" size={13} color={ACCENT} />
          <Text style={styles.editPillText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: catColor + '20' }]}>
            <Ionicons name="construct" size={40} color={catColor} />
          </View>
          <Text style={[styles.heroName, { color: c.text }]}>{service.name}</Text>
          <View style={styles.badgeRow}>
            {service.category ? (
              <View style={[styles.badge, { backgroundColor: catColor + '18' }]}>
                <Text style={[styles.badgeText, { color: catColor }]}>{service.category}</Text>
              </View>
            ) : null}
            <View
              style={[
                styles.badge,
                { backgroundColor: service.is_active ? '#22c55e18' : '#ef444418' },
              ]}
            >
              <Ionicons
                name={service.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
                size={13}
                color={service.is_active ? '#22c55e' : '#ef4444'}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: service.is_active ? '#22c55e' : '#ef4444' },
                ]}
              >
                {service.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Pricing</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <InfoRow
            icon="pricetag-outline"
            label="Base price"
            value={
              service.default_price != null
                ? formatCurrency(Number(service.default_price))
                : '—'
            }
            themeColors={c}
          />
          <Divider dividerColor={c.divider} />
          <InfoRow
            icon="receipt-outline"
            label="Tax rate"
            value={service.tax_rate != null ? `${service.tax_rate}%` : '—'}
            themeColors={c}
          />
          {totalRate != null && (
            <>
              <Divider dividerColor={c.divider} />
              <InfoRow
                icon="cash-outline"
                label="Total (incl. tax)"
                value={formatCurrency(totalRate)}
                highlight
                themeColors={c}
              />
            </>
          )}
        </View>

        {/* ── Duration ─────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Duration</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <InfoRow
            icon="time-outline"
            label="Est. duration"
            value={
              service.duration_minutes != null
                ? formatDuration(service.duration_minutes)
                : '—'
            }
            themeColors={c}
          />
        </View>

        {/* ── Description ──────────────────────────────────────────────────── */}
        {service.description ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Description</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.descText, { color: c.text }]}>{service.description}</Text>
            </View>
          </>
        ) : null}

        {/* ── Record Info ──────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Record Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <MetaRow label="Added" value={formatDate(service.created_at)} themeColors={c} />
          <Divider dividerColor={c.divider} />
          <MetaRow label="Last updated" value={formatDate(service.updated_at)} themeColors={c} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#F8F9FB' },
  container: { flex: 1, backgroundColor: '#F8F9FB' },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  notFoundText: { ...typography.body, color: colors.textSecondary },
  goBackBtn: { marginTop: spacing.sm },
  goBackText: { ...typography.body, color: ACCENT, fontWeight: '600' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { width: 44, alignItems: 'flex-start' },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT + '18',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editPillText: { ...typography.bodySmall, color: ACCENT, fontWeight: '700' },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },

  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xs },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroName: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },

  // ── Sections ──────────────────────────────────────────────────────────────
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  infoLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  infoValue: { ...typography.body, color: colors.text, fontWeight: '500' },
  infoValueHighlight: { color: ACCENT, fontWeight: '700' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 18 + spacing.md,
  },
  descText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaLabel: { ...typography.body, color: colors.textSecondary },
  metaValue: { ...typography.body, color: colors.text, fontWeight: '500' },
});
