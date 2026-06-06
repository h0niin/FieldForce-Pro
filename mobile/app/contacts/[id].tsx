import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { contactsApi, serviceLocationsApi } from '@/api/endpoints';
import { useContactDetail } from '@/hooks/use-customer-history';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Contact, ServiceLocation } from '@/types/models';

const ACCENT = '#4F6BF6';

function getInitials(contact: Contact): string {
  return `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase();
}

function parseCoords(location: ServiceLocation): { lat: number; lng: number } | null {
  const lat = location.lat != null ? Number(location.lat) : NaN;
  const lng = location.lng != null ? Number(location.lng) : NaN;
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

function buildMapsUrl(location: ServiceLocation): string {
  const label = encodeURIComponent(location.address);
  const coords = parseCoords(location);
  if (coords) {
    return Platform.select({
      ios: `maps:0,0?q=${label}@${coords.lat},${coords.lng}`,
      android: `geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}(${label})`,
      default: `https://maps.google.com/maps?daddr=${coords.lat},${coords.lng}`,
    });
  }
  return Platform.select({
    ios: `maps:?q=${label}`,
    android: `geo:0,0?q=${label}`,
    default: `https://maps.google.com/maps?daddr=${label}`,
  });
}

async function openNavigation(location: ServiceLocation): Promise<void> {
  const url = buildMapsUrl(location);
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    const coords = parseCoords(location);
    const label = encodeURIComponent(location.address);
    const fallback = coords
      ? `https://maps.google.com/maps?daddr=${coords.lat},${coords.lng}`
      : `https://maps.google.com/maps?daddr=${label}`;
    await Linking.openURL(fallback);
  }
}

export default function ContactDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [apiContact, setApiContact] = useState<Contact | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [locationsFailed, setLocationsFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  // WatermelonDB cache — used as offline fallback
  const { cached, isOffline } = useContactDetail(id);

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      contactsApi.getById(id),
      serviceLocationsApi.getByContact(id),
    ])
      .then(([contactResult, locationsResult]) => {
        if (contactResult.status === 'fulfilled') {
          setApiContact(contactResult.value.data.data ?? null);
        } else {
          setApiFailed(true);
        }
        if (locationsResult.status === 'fulfilled') {
          setServiceLocations(locationsResult.value.data.data ?? []);
        } else {
          setLocationsFailed(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  // When API failed and offline, fall back to the cached record
  const displayContact: Contact | null = apiContact ?? (apiFailed && isOffline ? cached : null);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!displayContact) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="person-outline" size={48} color={c.textLight} />
        <Text style={[styles.errorText, { color: c.textSecondary }]}>Contact not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const contact = displayContact;

  const handleCall = () => {
    if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  const handleEmail = () => {
    if (contact.email) Linking.openURL(`mailto:${contact.email}`);
  };

  const handleNavigate = () => {
    if (serviceLocations.length > 0) {
      openNavigation(serviceLocations[0]);
    }
  };

  const hasServiceLocations = serviceLocations.length > 0;
  const showingCached = apiFailed && isOffline && cached !== null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </TouchableOpacity>

      {/* Offline cached-data banner */}
      {showingCached && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={14} color={colors.textInverse} />
          <Text style={styles.offlineBannerText}>Offline — showing cached data</Text>
        </View>
      )}

      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(contact)}</Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>
          {contact.first_name} {contact.last_name}
        </Text>
        {contact.company_id && (
          <TouchableOpacity
            style={styles.companyRow}
            onPress={() => router.push(`/company/${contact.company_id}`)}
            activeOpacity={0.6}
          >
            <Ionicons name="business-outline" size={14} color={ACCENT} />
            <Text style={styles.companyLink}>View company</Text>
            <Ionicons name="chevron-forward" size={12} color={ACCENT} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick-action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: cardBg, borderColor }, !contact.phone && { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
          onPress={handleCall}
          disabled={!contact.phone}
        >
          <Ionicons
            name="call-outline"
            size={22}
            color={contact.phone ? ACCENT : c.textLight}
          />
          <Text style={[styles.actionLabel, !contact.phone && styles.actionLabelDisabled]}>
            Call
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: cardBg, borderColor }, !contact.email && { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
          onPress={handleEmail}
          disabled={!contact.email}
        >
          <Ionicons
            name="mail-outline"
            size={22}
            color={contact.email ? ACCENT : c.textLight}
          />
          <Text style={[styles.actionLabel, !contact.email && styles.actionLabelDisabled]}>
            Email
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: cardBg, borderColor }, !hasServiceLocations && { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
          onPress={handleNavigate}
          disabled={!hasServiceLocations}
        >
          <Ionicons
            name="navigate-outline"
            size={22}
            color={hasServiceLocations ? ACCENT : c.textLight}
          />
          <Text style={[styles.actionLabel, !hasServiceLocations && styles.actionLabelDisabled]}>
            Navigate
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contact info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Contact Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {contact.phone ? (
            <TouchableOpacity style={styles.infoRow} onPress={handleCall} activeOpacity={0.6}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.infoText, styles.infoLink]}>{contact.phone}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
            </TouchableOpacity>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoTextMuted}>No phone number</Text>
            </View>
          )}

          <View style={styles.divider} />

          {contact.email ? (
            <TouchableOpacity style={styles.infoRow} onPress={handleEmail} activeOpacity={0.6}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.infoText, styles.infoLink]} numberOfLines={1}>
                {contact.email}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
            </TouchableOpacity>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textLight} />
              <Text style={styles.infoTextMuted}>No email address</Text>
            </View>
          )}

          {contact.address && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoText}>{contact.address}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Service Locations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
          Service Locations{serviceLocations.length > 0 ? ` (${serviceLocations.length})` : ''}
        </Text>
        {locationsFailed ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>Could not load service locations</Text>
          </View>
        ) : serviceLocations.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="location-outline" size={32} color={colors.textLight} />
            <Text style={styles.emptyText}>No service locations</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {serviceLocations.map((loc, index) => (
              <View key={loc.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.locationRow}
                  onPress={() => router.push(`/service-location/${loc.id}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.textSecondary}
                    style={styles.locationIcon}
                  />
                  <View style={styles.locationBody}>
                    <Text style={styles.locationAddress} numberOfLines={2}>
                      {loc.address}
                    </Text>
                    {loc.access_notes ? (
                      <Text style={styles.locationMeta} numberOfLines={1}>
                        Access: {loc.access_notes}
                      </Text>
                    ) : null}
                    {loc.gate_code ? (
                      <Text style={styles.locationMeta}>Gate: {loc.gate_code}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => openNavigation(loc)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="navigate" size={16} color={colors.textInverse} />
                    <Text style={styles.navigateBtnText}>Go</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Tags</Text>
          <View style={styles.tagsWrap}>
            {contact.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Details</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Added</Text>
            <Text style={[styles.metaValue, { color: c.text }]}>{formatDate(contact.created_at)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Last updated</Text>
            <Text style={[styles.metaValue, { color: c.text }]}>{formatDate(contact.updated_at)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorBack: {
    marginTop: spacing.sm,
  },
  errorBackText: {
    ...typography.body,
    color: ACCENT,
    fontWeight: '600',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.textSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  offlineBannerText: {
    ...typography.bodySmall,
    color: colors.textInverse,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    ...typography.h2,
    color: colors.textInverse,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  companyLink: {
    ...typography.bodySmall,
    color: ACCENT,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8F9FB',
  },
  actionLabel: {
    ...typography.label,
    color: ACCENT,
  },
  actionLabelDisabled: {
    color: colors.textLight,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  infoLink: {
    color: ACCENT,
  },
  infoTextMuted: {
    ...typography.body,
    color: colors.textLight,
    flex: 1,
    fontStyle: 'italic',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 18 + spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  locationIcon: {
    flexShrink: 0,
  },
  locationBody: {
    flex: 1,
    gap: 2,
  },
  locationAddress: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  locationMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: ACCENT,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },
  navigateBtnText: {
    ...typography.label,
    color: colors.textInverse,
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: ACCENT,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
});
