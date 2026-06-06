import { useEffect, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, UserLocationChangeEvent } from 'react-native-maps';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import { appointmentsApi } from '@/api/endpoints';
import { STATUS_COLORS } from '@/utils/constants';
import { colors, spacing, typography, borderRadius } from '@/theme';
import type { Appointment } from '@/types/models';
import { useAuthStore } from '@/store/auth.store';
import { useAppTheme } from '@/hooks/useAppTheme';
import { MapErrorBoundary } from '@/components/MapErrorBoundary';

// Google Maps dark style (used on Android; iOS uses userInterfaceStyle)
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

// Default region (India) used as fallback when location is unavailable
const DEFAULT_REGION = {
  latitude: 10.8505,
  longitude: 76.2711,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

interface RouteInfo {
  coordinates: { latitude: number; longitude: number }[];
  distanceKm: number;
  durationMin: number;
  nextInstruction?: string;
  nextModifier?: string;
}

/**
 * Fetch driving route from OSRM (free, no API key needed).
 * Requests steps=true for turn-by-turn directions.
 */
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

    // Extract next turn instruction if available
    let nextInstruction = undefined;
    let nextModifier = undefined;
    if (route.legs?.[0]?.steps?.length > 0) {
      // Step 0 is usually the current road, Step 1 is the next maneuver
      const step = route.legs[0].steps.length > 1 ? route.legs[0].steps[1] : route.legs[0].steps[0];
      if (step.maneuver) {
        nextModifier = step.maneuver.modifier || step.maneuver.type; // e.g., 'right', 'left', 'straight'
        nextInstruction = `${step.maneuver.type === 'turn' ? 'Turn' : ''} ${nextModifier} on ${step.name || 'unknown road'}`;
      }
    }

    return {
      coordinates: decoded.map(([lat, lng]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      nextInstruction: nextInstruction?.trim() || 'Head towards destination',
      nextModifier,
    };
  } catch {
    return null;
  }
}

/** Haversine distance between two points in meters */
function getDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ARRIVAL_THRESHOLD_METERS = 50;

/** Maps OSRM maneuver modifiers to Ionicons */
function getTurnIcon(modifier?: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (modifier) {
    case 'left':
    case 'sharp left':
    case 'slight left':
      return 'arrow-undo';
    case 'right':
    case 'sharp right':
    case 'slight right':
      return 'arrow-redo';
    case 'straight':
      return 'arrow-up';
    case 'uturn':
      return 'arrow-undo-circle';
    default:
      return 'navigate';
  }
}

export default function MapScreenWrapper() {
  return (
    <MapErrorBoundary>
      <MapScreenInner />
    </MapErrorBoundary>
  );
}

function MapScreenInner() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const user = useAuthStore((s) => s.user);
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // User location captured from the MapView's native onUserLocationChange event
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const hasFittedRef = useRef(false);

  // Location permission state
  const [permissionStatus, setPermissionStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const canAskAgainRef = useRef(true);

  // Route state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const routeFetchedRef = useRef(false);

  // Navigation mode state
  const [isNavigating, setIsNavigating] = useState(false);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // ─── Request location permission on mount ───────────────────────────────
  const checkPermission = useCallback(async () => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      canAskAgainRef.current = perm.canAskAgain;
      setPermissionStatus(perm.status === 'granted' ? 'granted' : 'denied');

      // Fetch location if permission just got granted (e.g. from settings)
      if (perm.status === 'granted' && !userLocation) {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch { }
      }
    } catch {
      setPermissionStatus('denied');
    }
  }, [userLocation]);

  useEffect(() => {
    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      canAskAgainRef.current = perm.canAskAgain;
      setPermissionStatus(perm.status === 'granted' ? 'granted' : 'denied');

      // If granted, immediately fetch current position as a fallback
      // (onUserLocationChange from MapView may not fire on all devices)
      if (perm.status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch {
          // Silently fail — onUserLocationChange will be the backup
        }
      }
    })();
  }, []);

  // Re-check permission when user comes back from settings
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') checkPermission();
    });
    return () => sub.remove();
  }, [checkPermission]);

  const handleGrantPermission = async () => {
    if (canAskAgainRef.current) {
      // OS will show the native permission dialog
      const perm = await Location.requestForegroundPermissionsAsync();
      canAskAgainRef.current = perm.canAskAgain;
      setPermissionStatus(perm.status === 'granted' ? 'granted' : 'denied');
    } else {
      // Permission was permanently denied — only settings can fix it
      Linking.openSettings();
    }
  };

  // Accept optional destination params from other screens
  const { destLat, destLng, destTitle } = useLocalSearchParams<{
    destLat?: string;
    destLng?: string;
    destTitle?: string;
  }>();

  const hasDestination = !!(destLat && destLng);
  const destLatNum = hasDestination ? parseFloat(destLat!) : null;
  const destLngNum = hasDestination ? parseFloat(destLng!) : null;
  const destTitleStr = destTitle ? decodeURIComponent(destTitle) : 'Destination';

  // ─── Capture user location from the native MapView ──────────────────────
  const handleUserLocationChange = useCallback(
    (event: UserLocationChangeEvent) => {
      const { coordinate } = event.nativeEvent;
      if (!coordinate) return;
      const coords = { latitude: coordinate.latitude, longitude: coordinate.longitude };
      setUserLocation(coords);

      // Center on the user location the first time (if no destination)
      if (!hasFittedRef.current && !hasDestination && mapRef.current) {
        hasFittedRef.current = true;
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    },
    [hasDestination],
  );

  // ─── Start / Stop live navigation ───────────────────────────────────────
  const lastRouteUpdateRef = useRef(0);

  const startNavigation = useCallback(async () => {
    setIsNavigating(true);

    // Zoom into user's position with a driving-friendly view
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }

    // Start live location watcher for real-time updates
    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        async (loc) => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);

          // Follow user on the map
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...coords,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }

          // Arrival detection
          if (destLatNum != null && destLngNum != null) {
            const dist = getDistanceMeters(
              coords.latitude, coords.longitude,
              destLatNum, destLngNum,
            );
            if (dist < ARRIVAL_THRESHOLD_METERS) {
              // Arrived!
              Alert.alert(
                'You have arrived!',
                `You are within ${Math.round(dist)}m of your destination.`,
                [{ text: 'OK' }],
              );
              // Auto-stop navigation
              setIsNavigating(false);
              if (locationWatchRef.current) {
                locationWatchRef.current.remove();
                locationWatchRef.current = null;
              }
              return;
            }
          }

          // Update remaining distance/time every ~15 seconds
          const now = Date.now();
          if (destLatNum != null && destLngNum != null && now - lastRouteUpdateRef.current > 15000) {
            lastRouteUpdateRef.current = now;
            const updated = await fetchRoute(
              coords.latitude, coords.longitude,
              destLatNum, destLngNum,
            );
            if (updated) {
              setRouteInfo(updated);
            }
          }
        },
      );
      locationWatchRef.current = sub;
    } catch { }
  }, [userLocation, destLatNum, destLngNum]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
    // Zoom back out to show full route
    if (routeInfo && routeInfo.coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeInfo.coordinates, {
        edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
        animated: true,
      });
    }
  }, [routeInfo]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, []);

  // ─── Fetch appointments for markers ─────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      appointmentsApi
        .getMyAppointments({})
        .then((res) => setAppointments(res?.data?.data ?? []))
        .catch(() => { });
    }, [])
  );

  // ─── Calculate route once we have both location + destination ───────────
  const calculateRoute = useCallback(
    async (fromLat: number, fromLng: number) => {
      if (destLatNum == null || destLngNum == null) return;

      setRouteLoading(true);
      setRouteError(null);

      const info = await fetchRoute(fromLat, fromLng, destLatNum, destLngNum);

      if (!info) {
        setRouteError('Could not calculate route. Tap Retry.');
        setRouteLoading(false);
        return;
      }

      setRouteInfo(info);
      setRouteLoading(false);
      routeFetchedRef.current = true;

      // Fit map to the route
      if (info.coordinates.length > 0 && mapRef.current) {
        mapRef.current.fitToCoordinates(info.coordinates, {
          edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
          animated: true,
        });
      }
    },
    [destLatNum, destLngNum],
  );

  // Auto-calculate route when user location first arrives and destination is set
  useEffect(() => {
    if (hasDestination && userLocation && !routeFetchedRef.current && !routeLoading) {
      calculateRoute(userLocation.latitude, userLocation.longitude);
    }
  }, [hasDestination, userLocation, calculateRoute, routeLoading]);

  const handleRetry = () => {
    if (userLocation) {
      routeFetchedRef.current = false;
      calculateRoute(userLocation.latitude, userLocation.longitude);
    }
  };

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if (isNavigating && userLocation) {
      // Recenter on user during navigation
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } else if (routeInfo && routeInfo.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(routeInfo.coordinates, {
        edgePadding: { top: 120, right: 60, bottom: 220, left: 60 },
        animated: true,
      });
    } else if (userLocation) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Compute initial region
  const initialRegion =
    hasDestination && destLatNum != null && destLngNum != null
      ? { latitude: destLatNum, longitude: destLngNum, latitudeDelta: 0.05, longitudeDelta: 0.05 }
      : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={isNavigating}
        onUserLocationChange={handleUserLocationChange}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
      >
        {/* Route polyline */}
        {routeInfo && routeInfo.coordinates.length > 0 && (
          <Polyline
            coordinates={routeInfo.coordinates}
            strokeColor="#4285F4"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Destination marker */}
        {hasDestination && destLatNum != null && destLngNum != null && (
          <Marker
            key={`dest-purple`}
            coordinate={{ latitude: destLatNum, longitude: destLngNum }}
            title={destTitleStr}
            pinColor="purple"
          />
        )}

        {/* Appointment markers */}
        {appointments
          .filter((a) => a.latitude && a.longitude)
          .map((appointment) => {
            // If this appointment is the destination, don't render it here to avoid duplicate markers
            // since the Destination marker above will handle it.
            if (
              hasDestination &&
              destLatNum != null &&
              destLngNum != null &&
              appointment.latitude === destLatNum &&
              appointment.longitude === destLngNum
            ) {
              return null;
            }

            return (
              <Marker
                key={`${appointment.id}-pink`}
                coordinate={{
                  latitude: appointment.latitude!,
                  longitude: appointment.longitude!,
                }}
                title={appointment.customer_name}
                description={appointment.address}
                pinColor="pink"
                onCalloutPress={() => router.push(`/appointment/${appointment.id}`)}
              />
            );
          })}
      </MapView>

      {/* Permission / GPS banner */}
      {permissionStatus === 'denied' && (
        <View style={[styles.permissionBanner, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.permissionIconWrap}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.permissionTitle, { color: themeColors.text }]}>Location Access Needed</Text>
            <Text style={[styles.permissionSubtitle, { color: themeColors.textSecondary }]}>Grant permission to see your location and get directions</Text>
          </View>
          <TouchableOpacity style={styles.permissionBtn} onPress={handleGrantPermission}>
            <Text style={styles.permissionBtnText}>
              {canAskAgainRef.current ? 'Allow' : 'Open Settings'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation UI: Top Banner (Directions) + Bottom Panel (ETA) */}
      {hasDestination && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

          {/* Top Directions Banner - Only visible during active navigation */}
          {isNavigating && routeInfo && (
            <View style={[styles.navTopBanner, { borderColor }]}>
              <View style={styles.navDirectionIcon}>
                <Ionicons
                  name={getTurnIcon(routeInfo.nextModifier)}
                  size={40}
                  color={colors.white}
                />
              </View>
              <View style={styles.navDirectionTextWrap}>
                <Text style={styles.navDirectionText}>
                  {routeInfo.nextInstruction || 'Proceed to route'}
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Panel - Shows ETA and Start/Stop controls */}
          <View style={[styles.navPanel, { backgroundColor: cardBg, borderColor }, isNavigating && styles.navPanelNavigating]}>
            <View style={isNavigating ? styles.navNavigatingHeader : styles.navPanelHeader}>

              {/* If Navigating: Close button on Left */}
              {isNavigating && (
                <TouchableOpacity style={[styles.navCloseBtn, { backgroundColor: borderColor }]} onPress={stopNavigation}>
                  <Ionicons name="close" size={28} color={themeColors.text} />
                </TouchableOpacity>
              )}

              {/* Icon for non-navigating mode */}
              {!isNavigating && (
                <View style={styles.navIconWrap}>
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                </View>
              )}

              {/* Main Content Area */}
              <View style={[styles.navPanelInfo, isNavigating && { alignItems: 'center', justifyContent: 'center' }]}>
                {!isNavigating && (
                  <Text style={[styles.navPanelTitle, { color: themeColors.text }]} numberOfLines={1}>
                    {destTitleStr}
                  </Text>
                )}

                {routeLoading ? (
                  <View style={styles.navLoadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.navLoadingText, { color: themeColors.textSecondary }]}>Calculating route…</Text>
                  </View>
                ) : routeInfo ? (
                  <View style={isNavigating ? styles.navEtaContainer : styles.navStatsRow}>
                    {isNavigating ? (
                      <>
                        <Text style={styles.etaText}>
                          {routeInfo.durationMin < 60
                            ? `${Math.round(routeInfo.durationMin)} min`
                            : `${Math.floor(routeInfo.durationMin / 60)}h ${Math.round(routeInfo.durationMin % 60)}m`}
                        </Text>
                        <View style={styles.navEtaSubRow}>
                          <Text style={[styles.etaSubText, { color: themeColors.textSecondary }]}>
                            {routeInfo.distanceKm < 1
                              ? `${Math.round(routeInfo.distanceKm * 1000)} m`
                              : `${routeInfo.distanceKm.toFixed(1)} km`}
                          </Text>
                          <Text style={[styles.etaSubText, { color: themeColors.textSecondary }]}> • </Text>
                          <Text style={[styles.etaSubText, { color: themeColors.textSecondary }]}>
                            {new Date(Date.now() + routeInfo.durationMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.navStat}>
                          <Ionicons name="time-outline" size={14} color={colors.primary} />
                          <Text style={[styles.navStatValue, { color: themeColors.textSecondary }]}>
                            {routeInfo.durationMin < 60
                              ? `${Math.round(routeInfo.durationMin)} min`
                              : `${Math.floor(routeInfo.durationMin / 60)}h ${Math.round(routeInfo.durationMin % 60)}m`}
                          </Text>
                        </View>
                        <View style={[styles.navStatDot, { backgroundColor: borderColor }]} />
                        <View style={styles.navStat}>
                          <Ionicons name="speedometer-outline" size={14} color={colors.primary} />
                          <Text style={[styles.navStatValue, { color: themeColors.textSecondary }]}>
                            {routeInfo.distanceKm < 1
                              ? `${Math.round(routeInfo.distanceKm * 1000)} m`
                              : `${routeInfo.distanceKm.toFixed(1)} km`}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                ) : routeError ? (
                  <TouchableOpacity onPress={handleRetry} style={styles.retryRow}>
                    <Text style={styles.navErrorText} numberOfLines={2}>
                      {routeError}
                    </Text>
                    <View style={styles.retryBtn}>
                      <Ionicons name="refresh" size={14} color={colors.white} />
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </View>
                  </TouchableOpacity>
                ) : !userLocation ? (
                  <View style={styles.navLoadingRow}>
                    <ActivityIndicator size="small" color={themeColors.textSecondary} />
                    <Text style={[styles.navLoadingText, { color: themeColors.textSecondary }]}>Waiting for your location…</Text>
                  </View>
                ) : null}
              </View>

              {/* If Navigating: Route Icon on Right (for balance/design) */}
              {isNavigating && (
                <View style={styles.navRouteBtnPlaceholder}>
                  <Ionicons name="git-network-outline" size={24} color={themeColors.textSecondary} />
                </View>
              )}

              {/* If Not Navigating: Start Button on Right */}
              {!isNavigating && routeInfo && (
                <TouchableOpacity style={styles.navStartBtnMini} onPress={startNavigation}>
                  <Ionicons name="navigate" size={20} color={colors.white} />
                  <Text style={styles.navStartBtnMiniText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

        </View>
      )}

      {/* My Location / Re-fit FAB */}
      <TouchableOpacity
        style={[styles.myLocationFab, { backgroundColor: cardBg, borderColor }, hasDestination && { bottom: isNavigating ? 180 : 120 }]}
        onPress={handleRecenter}
      >
        <Ionicons
          name={isNavigating ? 'locate' : (routeInfo ? 'expand' : 'locate')}
          size={22}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* Legend removed per user request */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // ── Top banner ────────────────────────────────────────────────────────────
  topBanner: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  topBannerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── Permission banner ─────────────────────────────────────────────────────
  permissionBanner: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  permissionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    ...typography.label,
    color: colors.text,
  },
  permissionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  permissionBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Navigation panel ──────────────────────────────────────────────────────
  navPanel: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  navPanelNavigating: {
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing['2xl'], // extra padding for home indicator
  },
  navPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navNavigatingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  navIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPanelInfo: {
    flex: 1,
  },
  navPanelTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  navLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navLoadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  navStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navEtaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  navEtaSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  etaText: {
    ...typography.h2,
    color: '#1A73E8', // Google maps green
    fontWeight: '800',
  },
  etaLabelText: {
    ...typography.caption,
    color: '#1A73E8',
    fontWeight: '700',
    marginBottom: 2,
  },
  etaSubText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingBottom: 2,
  },
  navStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navStatValue: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  navStatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 6,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.error + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  navErrorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
    marginRight: spacing.sm,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },

  // ── Action Buttons ─────────────────────────────────────────────────────────
  navStartBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#4CAF50',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 30,
  },
  navStartBtnMiniText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
  navCloseBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRouteBtnPlaceholder: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Auto-Navigation Top Banner ──────────────────────────────────────────────
  navTopBanner: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#1A73E8', // Green like google maps
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  navDirectionIcon: {
    marginRight: spacing.md,
  },
  navDirectionTextWrap: {
    flex: 1,
  },
  navDirectionText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
  },

  // ── FAB ────────────────────────────────────────────────────────────────────
  myLocationFab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 80,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },

  // ── Legend ─────────────────────────────────────────────────────────────────
  legend: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

});
