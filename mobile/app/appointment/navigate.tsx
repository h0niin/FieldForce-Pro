import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import { appointmentsApi, tripsApi } from '@/api/endpoints';
import { AppointmentStatus } from '@/types/models';
import { goBack } from '@/utils/navigation';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';
const ACCENT = '#4F6BF6';

interface RouteInfo {
  coordinates: { latitude: number; longitude: number }[];
  distanceKm: number;
  durationMin: number;
  steps: StepInfo[];
}

interface StepInfo {
  instruction: string;
  modifier?: string;
  distance: number; // meters
  duration: number; // seconds
  name: string;
}

async function fetchRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
): Promise<RouteInfo | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=full&geometries=polyline&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    const decoded = polyline.decode(route.geometry);
    const steps: StepInfo[] = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: formatInstruction(s),
      modifier: s.maneuver?.modifier || s.maneuver?.type,
      distance: s.distance,
      duration: s.duration,
      name: s.name || '',
    }));

    return {
      coordinates: decoded.map(([lat, lng]: [number, number]) => ({ latitude: lat, longitude: lng })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      steps,
    };
  } catch {
    return null;
  }
}

function formatInstruction(step: any): string {
  const type = step.maneuver?.type ?? '';
  const modifier = step.maneuver?.modifier ?? '';
  const road = step.name || 'the road';
  if (type === 'depart') return `Head on ${road}`;
  if (type === 'arrive') return 'You have arrived';
  if (type === 'turn') return `Turn ${modifier} onto ${road}`;
  if (type === 'merge') return `Merge ${modifier} onto ${road}`;
  if (type === 'roundabout' || type === 'rotary') return `Take the roundabout to ${road}`;
  if (type === 'fork') return `Keep ${modifier} onto ${road}`;
  if (type === 'new name') return `Continue onto ${road}`;
  if (type === 'end of road') return `Turn ${modifier} onto ${road}`;
  return `Continue on ${road}`;
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function formatEta(min: number): string {
  return new Date(Date.now() + min * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTurnIcon(modifier?: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (modifier) {
    case 'left': case 'sharp left': case 'slight left': return 'arrow-undo';
    case 'right': case 'sharp right': case 'slight right': return 'arrow-redo';
    case 'uturn': return 'arrow-undo-circle';
    case 'straight': default: return 'arrow-up';
  }
}

const ARRIVAL_THRESHOLD = 50;

export default function NavigateScreenWrapper() {
  return (
    <MapErrorBoundary>
      <NavigateScreen />
    </MapErrorBoundary>
  );
}

function NavigateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const { destLat, destLng, destTitle, appointmentId } = useLocalSearchParams<{
    destLat: string;
    destLng: string;
    destTitle?: string;
    appointmentId?: string;
  }>();

  const destLatNum = destLat ? parseFloat(destLat) : 0;
  const destLngNum = destLng ? parseFloat(destLng) : 0;
  const destTitleStr = destTitle ? decodeURIComponent(destTitle) : 'Destination';

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [updatingArrival, setUpdatingArrival] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const lastUpdateRef = useRef(0);
  const arrivedHandled = useRef(false);

  // Get initial location and route
  useEffect(() => {
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Location Required', 'Please grant location permission to use navigation.');
        setIsLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);

        const route = await fetchRoute(coords.latitude, coords.longitude, destLatNum, destLngNum);
        setRouteInfo(route);

        // Fit map to show full route
        if (route && route.coordinates.length > 0 && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(route.coordinates, {
              edgePadding: { top: 140, right: 60, bottom: 260, left: 60 },
              animated: true,
            });
          }, 500);
        }
      } catch {}
      setIsLoading(false);
    })();
  }, [destLatNum, destLngNum]);

  // Start live navigation
  const startNavigation = useCallback(async () => {
    setIsNavigating(true);
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      });
    }
    try {
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        async (loc) => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);

          mapRef.current?.animateToRegion({
            ...coords,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          });

          // Arrival detection
          const dist = getDistanceMeters(coords.latitude, coords.longitude, destLatNum, destLngNum);
          if (dist < ARRIVAL_THRESHOLD && !arrivedHandled.current) {
            arrivedHandled.current = true;
            setArrived(true);
            setIsNavigating(false);
            sub.remove();
            // Auto-update status and end trip if appointmentId provided
            if (appointmentId) {
              try {
                await appointmentsApi.updateStatus(appointmentId, AppointmentStatus.ON_SITE);
                const activeTrip = await tripsApi.getActive();
                if (activeTrip?.data?.data?.id) {
                  await tripsApi.endTrip(activeTrip.data.data.id, {
                    end_lat: coords.latitude,
                    end_lng: coords.longitude,
                  });
                }
              } catch {
                // Non-blocking — [id].tsx will handle manual arrival
              }
              // Auto-navigate back after 2.5s
              setTimeout(() => goBack(), 2500);
            }
            return;
          }

          // Re-fetch route every 15s
          const now = Date.now();
          if (now - lastUpdateRef.current > 15000) {
            lastUpdateRef.current = now;
            const updated = await fetchRoute(coords.latitude, coords.longitude, destLatNum, destLngNum);
            if (updated) setRouteInfo(updated);
          }
        },
      );
      watchRef.current = sub;
    } catch {}
  }, [userLocation, destLatNum, destLngNum]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    watchRef.current?.remove();
    watchRef.current = null;
    // Return to appointment detail
    goBack();
  }, []);

  useEffect(() => {
    return () => { watchRef.current?.remove(); };
  }, []);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (isNavigating && userLocation) {
      mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.004, longitudeDelta: 0.004 });
    } else if (routeInfo?.coordinates.length) {
      mapRef.current.fitToCoordinates(routeInfo.coordinates, {
        edgePadding: { top: 140, right: 60, bottom: 260, left: 60 },
        animated: true,
      });
    } else if (userLocation) {
      mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    }
  };

  const currentStep = routeInfo?.steps?.[isNavigating ? 1 : 0] ?? routeInfo?.steps?.[0];
  const nextStepDistance = currentStep ? formatDistance(currentStep.distance / 1000) : '';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: destLatNum,
          longitude: destLngNum,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={isNavigating}
        showsCompass={false}
        mapPadding={{ top: 100, right: 0, bottom: 200, left: 0 }}
      >
        {routeInfo && routeInfo.coordinates.length > 0 && (
          <Polyline
            coordinates={routeInfo.coordinates}
            strokeColor={ACCENT}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}
        <Marker
          coordinate={{ latitude: destLatNum, longitude: destLngNum }}
          title={destTitleStr}
          pinColor="red"
        />
      </MapView>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + spacing.sm, backgroundColor: cardBg, borderColor }]}
        onPress={() => goBack()}
      >
        <Ionicons name="arrow-back" size={22} color={themeColors.text} />
      </TouchableOpacity>

      {/* Recenter FAB */}
      <TouchableOpacity
        style={[styles.recenterFab, { bottom: isNavigating ? 200 : 240, backgroundColor: cardBg, borderColor }]}
        onPress={handleRecenter}
      >
        <Ionicons name="locate" size={22} color={ACCENT} />
      </TouchableOpacity>

      {/* Turn-by-turn banner during navigation */}
      {isNavigating && currentStep && (
        <View style={[styles.turnBanner, { top: insets.top + spacing.sm }]}>
          <View style={styles.turnIconWrap}>
            <Ionicons name={getTurnIcon(currentStep.modifier)} size={32} color="#fff" />
          </View>
          <View style={styles.turnInfo}>
            <Text style={styles.turnDistance}>{nextStepDistance}</Text>
            <Text style={styles.turnInstruction} numberOfLines={2}>
              {currentStep.instruction}
            </Text>
          </View>
        </View>
      )}

      {/* Arrived banner */}
      {arrived && (
        <View style={[styles.arrivedBanner, { top: insets.top + spacing.sm }]}>
          <Ionicons name="checkmark-circle" size={28} color="#fff" />
          <Text style={styles.arrivedText}>You have arrived!</Text>
        </View>
      )}

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + spacing.lg, backgroundColor: cardBg, borderColor }]}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Getting directions...</Text>
          </View>
        ) : routeInfo ? (
          <>
            {/* ETA info */}
            <View style={styles.etaRow}>
              <View style={styles.etaPrimary}>
                <Text style={styles.etaTime}>{formatDuration(routeInfo.durationMin)}</Text>
                <Text style={[styles.etaDetail, { color: themeColors.textSecondary }]}>
                  {formatDistance(routeInfo.distanceKm)} · ETA {formatEta(routeInfo.durationMin)}
                </Text>
              </View>
            </View>

            {/* Destination label */}
            <View style={[styles.destRow, { borderTopColor: themeColors.divider }]}>
              <Ionicons name="location" size={16} color="#EA4335" />
              <Text style={[styles.destText, { color: themeColors.text }]} numberOfLines={1}>{destTitleStr}</Text>
            </View>

            {/* Action button */}
            {arrived ? (
              <TouchableOpacity style={styles.arrivedBtn} onPress={() => goBack()}>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
                <Text style={styles.btnText}>Done</Text>
              </TouchableOpacity>
            ) : isNavigating ? (
              <TouchableOpacity style={styles.stopBtn} onPress={stopNavigation}>
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.btnText}>Stop Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.startBtn} onPress={startNavigation}>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.btnText}>Start</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.errorRow}>
            <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>Could not calculate route</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={async () => {
                if (!userLocation) return;
                setIsLoading(true);
                const route = await fetchRoute(userLocation.latitude, userLocation.longitude, destLatNum, destLngNum);
                setRouteInfo(route);
                setIsLoading(false);
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  recenterFab: {
    position: 'absolute',
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Turn banner (Google Maps style)
  turnBanner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: ACCENT,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  turnIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  turnInfo: { flex: 1 },
  turnDistance: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '700',
  },
  turnInstruction: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // Arrived banner
  arrivedBanner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#0F9D58',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  arrivedText: {
    ...typography.h3,
    color: '#fff',
    fontWeight: '700',
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  etaRow: {
    marginBottom: spacing.md,
  },
  etaPrimary: {},
  etaTime: {
    fontSize: 28,
    fontWeight: '700',
    color: ACCENT,
  },
  etaDetail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },

  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  destText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    height: 52,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#EA4335',
    borderRadius: 28,
    paddingVertical: 14,
  },
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#0F9D58',
    borderRadius: 28,
    paddingVertical: 14,
  },
  btnText: {
    ...typography.button,
    color: '#fff',
    fontWeight: '700',
  },

  errorRow: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  retryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryText: {
    ...typography.button,
    color: '#fff',
  },
});
