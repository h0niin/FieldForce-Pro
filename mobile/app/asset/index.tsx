import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { assetsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Asset } from '@/types/models';

const ACCENT = '#4F6BF6';

function parseHealthScore(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

function HealthBadge({ score }: { score: number | string | null | undefined }) {
  const n = parseHealthScore(score);
  if (n === null) return null;

  let bg: string = colors.textLight;
  let label = 'Unknown';
  if (n >= 80) { bg = '#22c55e'; label = `${Math.round(n)}%`; }
  else if (n >= 60) { bg = '#f59e0b'; label = `${Math.round(n)}%`; }
  else { bg = '#ef4444'; label = `${Math.round(n)}%`; }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function AssetLookupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scanner state
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const fetchAssets = useCallback(async (query: string) => {
    setFetchError(false);
    try {
      const res = await assetsApi.getAll({
        search: query.trim() || undefined,
        take: 50,
      });
      setAssets(res.data.data ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const delay = searchQuery ? 400 : 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAssets(searchQuery), delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchAssets]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssets(searchQuery);
  };

  const handleScanPress = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }
    setScanned(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannerVisible(false);
    setSearchQuery(data.trim());
  };

  const handleCloseScanner = () => {
    setScannerVisible(false);
    setScanned(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Assets</Text>
        <TouchableOpacity
          onPress={handleScanPress}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="scan-outline" size={24} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search-outline" size={18} color={c.textLight} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, serial number…"
          placeholderTextColor={c.textLight}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={c.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            assets.length === 0 ? styles.emptyContainer : styles.listContent,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={ACCENT}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={fetchError ? 'cloud-offline-outline' : 'construct-outline'}
                size={56}
                color={c.textLight}
              />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {fetchError
                  ? 'Could not load assets'
                  : searchQuery
                    ? 'No assets found'
                    : 'No assets yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {fetchError
                  ? 'Check your connection and pull down to retry.'
                  : searchQuery
                    ? 'Try a different name or serial number.'
                    : 'Assets added via the web portal will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push(`/asset/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="construct" size={22} color={c.textInverse} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {(item.manufacturer || item.model) ? (
                  <Text style={[styles.cardMeta, { color: c.textSecondary }]} numberOfLines={1}>
                    {[item.manufacturer, item.model].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
                {item.serial_number ? (
                  <Text style={[styles.cardMeta, { color: c.textSecondary }]} numberOfLines={1}>
                    S/N: {item.serial_number}
                  </Text>
                ) : null}
                {item.category ? (
                  <Text style={styles.cardCategory} numberOfLines={1}>
                    {item.category}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <HealthBadge score={item.health_score} />
                <Ionicons name="chevron-forward" size={18} color={c.textLight} />
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Add asset FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + spacing.xl }]}
        onPress={() => router.push('/asset/new')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={handleCloseScanner}
        statusBarTranslucent
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'code128',
                'code39',
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'datamatrix',
                'pdf417',
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />

          {/* Dark overlay — top */}
          <View style={[styles.scanOverlayEdge, { paddingTop: insets.top + spacing.md }]}>
            {/* Close button */}
            <TouchableOpacity onPress={handleCloseScanner} style={styles.scanCloseBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.scanTitle}>Scan Barcode / QR Code</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Finder window row */}
          <View style={styles.scanMiddleRow}>
            <View style={styles.scanOverlaySide} />
            <View style={styles.scanFinder}>
              {/* Corner marks */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.scanOverlaySide} />
          </View>

          {/* Dark overlay — bottom */}
          <View style={styles.scanOverlayEdge}>
            <Text style={styles.scanHint}>
              Point at a barcode, QR code, or serial number label
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FINDER_SIZE = 240;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing['5xl'],
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  cardMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardCategory: {
    ...typography.bodySmall,
    color: ACCENT,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  separator: {
    height: spacing.sm,
  },

  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // ── Scanner ────────────────────────────────────────────────────────────────
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanOverlayEdge: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  scanCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scanMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanOverlaySide: {
    flex: 1,
    height: FINDER_SIZE,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  scanFinder: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
  },
  scanHint: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    flex: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
});
