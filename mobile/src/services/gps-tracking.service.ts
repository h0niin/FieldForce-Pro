/**
 * GPS Tracking Service
 *
 * Manages foreground location watching and pushes updates to the
 * agent-locations API endpoint so dispatchers can see live positions.
 *
 * For true BACKGROUND tracking (while the app is minimised), install:
 *   npx expo install expo-task-manager
 * and configure the background location task in app/_layout.tsx.
 * The `startBackgroundGPS` stub below shows the required structure.
 */

import * as Location from 'expo-location';
import { agentLocationsApi } from '@/api/endpoints';

// Minimum time (ms) and distance (m) between location pushes to the server
const UPDATE_INTERVAL_MS = 15_000; // 15 seconds
const UPDATE_DISTANCE_M = 30; // 30 metres

let _subscription: Location.LocationSubscription | null = null;
let _isTracking = false;

/** Returns true if foreground location tracking is currently active. */
export function isForegroundGPSActive(): boolean {
  return _isTracking;
}

/**
 * Request location permissions and start watching the device's position.
 * Each update is pushed to the server's agent-locations endpoint.
 *
 * @returns true if tracking started successfully.
 */
export async function startForegroundGPS(): Promise<boolean> {
  if (_isTracking) return true;

  try {
    // Only use permission that has already been granted — do NOT prompt here.
    // Prompting at clock-in time is unexpected UX. Call requestLocationPermission()
    // from a dedicated settings screen to ask the user explicitly.
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      return false; // Silently skip — GPS tracking disabled until permission granted
    }

    _subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: UPDATE_INTERVAL_MS,
        distanceInterval: UPDATE_DISTANCE_M,
      },
      async (loc) => {
        try {
          await agentLocationsApi.updateLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
            speed: loc.coords.speed ?? undefined,
          });
        } catch {
          // Network failure — silently ignore; next tick will retry
        }
      },
    );

    _isTracking = true;
    return true;
  } catch (err) {
    console.error('[GPS] Failed to start foreground tracking:', err);
    return false;
  }
}

/**
 * Stop foreground location watching.
 */
export async function stopForegroundGPS(): Promise<void> {
  _subscription?.remove();
  _subscription = null;
  _isTracking = false;
}

/**
 * Explicitly ask the user for foreground location permission.
 * Call this from a settings screen or an "Enable GPS" button — not silently.
 *
 * @returns true if the user granted permission.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Fetch and return the device's current position once (no continuous watch).
 * Only works if permission has already been granted.
 */
export async function getCurrentPosition(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
  } catch {
    return null;
  }
}

// ── Background GPS stub ──────────────────────────────────────────────────────
//
// To enable background tracking, install expo-task-manager, then replace the
// stub below with the full implementation:
//
//   import * as TaskManager from 'expo-task-manager';
//   import * as Location from 'expo-location';
//
//   const BG_TASK = 'BACKGROUND_LOCATION_TASK';
//
//   // Register the task at module load time (must run before the app renders):
//   TaskManager.defineTask(BG_TASK, async ({ data, error }) => {
//     if (error) return;
//     const { locations } = data as { locations: Location.LocationObject[] };
//     for (const loc of locations) {
//       await agentLocationsApi.updateLocation({
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//         accuracy: loc.coords.accuracy ?? undefined,
//         speed: loc.coords.speed ?? undefined,
//       });
//     }
//   });
//
//   export async function startBackgroundGPS(): Promise<boolean> {
//     const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
//     if (fgStatus !== 'granted') return false;
//     const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
//     if (bgStatus !== 'granted') return false;
//     await Location.startLocationUpdatesAsync(BG_TASK, {
//       accuracy: Location.Accuracy.High,
//       timeInterval: 15_000,
//       distanceInterval: 30,
//       foregroundService: {
//         notificationTitle: 'FieldForce Pro',
//         notificationBody: 'Location tracking active',
//         notificationColor: '#1B4332',
//       },
//     });
//     return true;
//   }
//
//   export async function stopBackgroundGPS(): Promise<void> {
//     const started = await Location.hasStartedLocationUpdatesAsync(BG_TASK);
//     if (started) await Location.stopLocationUpdatesAsync(BG_TASK);
//   }
