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
import MapView, { Marker } from 'react-native-maps';
import { serviceLocationsApi, contactsApi, companiesApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ServiceLocation, Contact, Company } from '@/types/models';

const ACCENT = '#4F6BF6';

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

export default function ServiceLocationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [location, setLocation] = useState<ServiceLocation | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    serviceLocationsApi
      .getById(id)
      .then((res) => {
        const loc = res.data.data ?? null;
        setLocation(loc);

        if (!loc) return;

        // Fetch linked contact and company in parallel
        return Promise.allSettled([
          loc.contact_id ? contactsApi.getById(loc.contact_id) : Promise.resolve(null),
          loc.company_id ? companiesApi.getById(loc.company_id) : Promise.resolve(null),
        ]).then(([contactResult, companyResult]) => {
          if (contactResult.status === 'fulfilled' && contactResult.value) {
            setContact(contactResult.value.data.data ?? null);
          }
          if (companyResult.status === 'fulfilled' && companyResult.value) {
            setCompany(companyResult.value.data.data ?? null);
          }
        });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <Ionicons name="location-outline" size={48} color={themeColors.textSecondary} />
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>Service location not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coords = parseCoords(location);
  const hasCoords = coords !== null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="location" size={36} color={colors.textInverse} />
        </View>
        <Text style={[styles.heroAddress, { color: themeColors.text }]} numberOfLines={3}>
          {location.address}
        </Text>
      </View>

      {/* Navigate button */}
      <TouchableOpacity style={styles.navigateButton} onPress={() => openNavigation(location)}>
        <Ionicons name="navigate" size={20} color={colors.textInverse} />
        <Text style={styles.navigateButtonText}>Navigate Here</Text>
      </TouchableOpacity>

      {/* Map preview */}
      {hasCoords && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Map</Text>
          <View style={[styles.mapCard, { borderColor }]}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: coords!.lat,
                longitude: coords!.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Marker
                coordinate={{ latitude: coords!.lat, longitude: coords!.lng }}
                title="Service Location"
                description={location.address}
                pinColor="pink"
              />
            </MapView>

            <TouchableOpacity
              style={[styles.mapOverlayButton, { backgroundColor: cardBg, borderTopColor: borderColor }]}
              onPress={() => openNavigation(location)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate-outline" size={16} color={ACCENT} />
              <Text style={styles.mapOverlayText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Location details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Location Details</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          {/* Address */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={themeColors.textSecondary} />
            <Text style={[styles.infoText, { color: themeColors.text }]}>{location.address}</Text>
          </View>

          {/* Coordinates */}
          {hasCoords && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.infoRow}>
                <Ionicons name="compass-outline" size={18} color={themeColors.textSecondary} />
                <Text style={[styles.infoText, { color: themeColors.text }]}>
                  {coords!.lat.toFixed(6)}, {coords!.lng.toFixed(6)}
                </Text>
              </View>
            </>
          )}

          {/* Access notes */}
          {location.access_notes ? (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={18} color={themeColors.textSecondary} />
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Access Notes</Text>
                  <Text style={[styles.infoText, { color: themeColors.text }]}>{location.access_notes}</Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Gate code */}
          {location.gate_code ? (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.infoRow}>
                <Ionicons name="keypad-outline" size={18} color={themeColors.textSecondary} />
                <View style={styles.infoBlock}>
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>Gate Code</Text>
                  <Text style={styles.gateCode}>{location.gate_code}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {/* Linked contact */}
      {contact && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Contact</Text>
          <TouchableOpacity
            style={[styles.linkedCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push(`/contacts/${contact.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.linkedAvatar}>
              <Text style={styles.linkedAvatarText}>
                {`${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase()}
              </Text>
            </View>
            <View style={styles.linkedBody}>
              <Text style={[styles.linkedName, { color: themeColors.text }]}>
                {contact.first_name} {contact.last_name}
              </Text>
              {contact.phone && (
                <Text style={[styles.linkedDetail, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {contact.phone}
                </Text>
              )}
              {!contact.phone && contact.email && (
                <Text style={[styles.linkedDetail, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {contact.email}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Linked company */}
      {company && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Company</Text>
          <TouchableOpacity
            style={[styles.linkedCard, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.push(`/company/${company.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.linkedAvatar}>
              <Ionicons name="business" size={20} color={colors.textInverse} />
            </View>
            <View style={styles.linkedBody}>
              <Text style={[styles.linkedName, { color: themeColors.text }]}>{company.name}</Text>
              {company.industry && (
                <Text style={[styles.linkedDetail, { color: themeColors.textSecondary }]} numberOfLines={1}>
                  {company.industry}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Record Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: themeColors.textSecondary }]}>Added</Text>
            <Text style={[styles.metaValue, { color: themeColors.text }]}>{formatDate(location.created_at)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: themeColors.textSecondary }]}>Last updated</Text>
            <Text style={[styles.metaValue, { color: themeColors.text }]}>{formatDate(location.updated_at)}</Text>
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
  backButton: {
    marginBottom: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAddress: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: 10,
    height: 52,
    marginBottom: spacing['2xl'],
  },
  navigateButtonText: {
    ...typography.button,
    color: colors.textInverse,
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
  mapCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  map: {
    height: 200,
  },
  mapOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  mapOverlayText: {
    ...typography.label,
    color: ACCENT,
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
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  gateCode: {
    ...typography.h4,
    color: ACCENT,
    letterSpacing: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 18 + spacing.md,
  },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linkedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkedAvatarText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 14,
  },
  linkedBody: {
    flex: 1,
    gap: 2,
  },
  linkedName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  linkedDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
