/**
 * Map Navigation Utility
 *
 * Platform-aware deep links:
 *  - iOS  → Apple Maps (maps:) by default, Google Maps (comgooglemaps:) as
 *            fallback if the app is installed, then web Google Maps
 *  - Android → Google Maps navigation intent, then web Google Maps
 *
 * Usage:
 *   await openMapsNavigation('123 Main St, Springfield');
 *   await openMapsNavigation('Job Site', 37.7749, -122.4194);
 *   await openGoogleMaps('Job Site', 37.7749, -122.4194);
 *   await openAppleMaps('Job Site', 37.7749, -122.4194);
 */

import { Alert, Linking, Platform } from 'react-native';

// ── Helpers ──────────────────────────────────────────────────────────────────

function encodedAddress(address: string): string {
  return encodeURIComponent(address);
}

function coordsStr(lat: number, lng: number): string {
  return `${lat},${lng}`;
}

async function safeOpen(primaryUrl: string, fallbackUrl: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(primaryUrl);
    await Linking.openURL(supported ? primaryUrl : fallbackUrl);
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
    } catch {
      Alert.alert('Maps Error', 'Unable to open a Maps application on this device.');
    }
  }
}

// ── Platform-default navigation ───────────────────────────────────────────────

/**
 * Open the platform's default maps app for turn-by-turn navigation.
 *
 * @param address  Human-readable address (used when coords are unavailable)
 * @param lat      Destination latitude  (preferred for accuracy)
 * @param lng      Destination longitude (preferred for accuracy)
 */
export async function openMapsNavigation(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<void> {
  const hasCoords = lat != null && lng != null;
  const destination = hasCoords ? coordsStr(lat!, lng!) : encodedAddress(address);
  const webFallback = hasCoords
    ? `https://maps.google.com/maps?daddr=${destination}`
    : `https://maps.google.com/?q=${destination}`;

  if (Platform.OS === 'ios') {
    const appleUrl = hasCoords
      ? `maps:?daddr=${destination}`
      : `maps:?q=${destination}`;
    await safeOpen(appleUrl, webFallback);
  } else {
    // Android — prefer the navigation intent so Google Maps opens in nav mode
    const googleNavUrl = `google.navigation:q=${destination}`;
    await safeOpen(googleNavUrl, webFallback);
  }
}

// ── Google Maps (explicit) ────────────────────────────────────────────────────

/**
 * Force-open Google Maps (native app if installed, web otherwise).
 */
export async function openGoogleMaps(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<void> {
  const hasCoords = lat != null && lng != null;
  const destination = hasCoords ? coordsStr(lat!, lng!) : encodedAddress(address);

  // comgooglemaps:// is the iOS custom URL scheme for the Google Maps app
  const nativeUrl =
    Platform.OS === 'ios'
      ? `comgooglemaps://?daddr=${destination}&directionsmode=driving`
      : `google.navigation:q=${destination}`;

  const webFallback = hasCoords
    ? `https://maps.google.com/maps?daddr=${destination}`
    : `https://maps.google.com/?q=${destination}`;

  await safeOpen(nativeUrl, webFallback);
}

// ── Apple Maps (explicit, iOS only) ──────────────────────────────────────────

/**
 * Force-open Apple Maps for navigation (iOS only; falls back to Google Maps web on Android).
 */
export async function openAppleMaps(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<void> {
  if (Platform.OS !== 'ios') {
    // Android doesn't have Apple Maps — fall back to Google Maps web
    return openGoogleMaps(address, lat, lng);
  }

  const hasCoords = lat != null && lng != null;
  const destination = hasCoords ? coordsStr(lat!, lng!) : encodedAddress(address);
  const appleUrl = `maps:?daddr=${destination}`;

  await safeOpen(appleUrl, `https://maps.apple.com/?daddr=${destination}`);
}

// ── Convenience: open a location for viewing (not navigation) ─────────────────

/**
 * Open maps to view/search a location without starting navigation.
 */
export async function viewOnMaps(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<void> {
  const hasCoords = lat != null && lng != null;
  const destination = hasCoords ? coordsStr(lat!, lng!) : encodedAddress(address);

  if (Platform.OS === 'ios') {
    await safeOpen(`maps:?q=${destination}`, `https://maps.google.com/?q=${destination}`);
  } else {
    await safeOpen(`geo:0,0?q=${destination}`, `https://maps.google.com/?q=${destination}`);
  }
}
