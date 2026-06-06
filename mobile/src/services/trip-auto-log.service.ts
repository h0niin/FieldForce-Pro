/**
 * Trip Auto-Log Service
 *
 * Watches the device's location while the technician is clocked in.
 * Automatically starts a trip record when sustained movement is detected
 * and ends it when the device becomes stationary again.
 *
 * Movement thresholds (tunable):
 *   - MOVING_SPEED_KMH   : speed above which we consider the device "moving"
 *   - STATIONARY_SECONDS : seconds below threshold before we end the active trip
 *   - MIN_TRIP_SECONDS   : minimum trip duration to record (avoids noise trips)
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tripsApi } from '@/api/endpoints';

const MOVING_SPEED_KMH = 8; // ~5 mph
const STATIONARY_SECONDS = 120; // 2 minutes of stillness to end trip
const MIN_TRIP_SECONDS = 60; // trips shorter than 1 min are ignored
const WATCH_INTERVAL_MS = 5_000;
const WATCH_DISTANCE_M = 10;

const STORAGE_KEYS = {
  ACTIVE_TRIP_ID: 'trip_auto_log:active_trip_id',
  ACTIVE_TRIP_APPT: 'trip_auto_log:active_appointment_id',
  TRIP_START_TS: 'trip_auto_log:trip_start_timestamp',
} as const;

let _subscription: Location.LocationSubscription | null = null;
let _stationaryStart: number | null = null; // timestamp when we first went still
let _isRunning = false;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mpsToKmh(mps: number): number {
  return mps * 3.6;
}

async function getActiveTripId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP_ID);
}

async function setActiveTripId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP_ID, id);
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP_ID);
  }
}

async function getTripStartTimestamp(): Promise<number | null> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_START_TS);
  return val ? parseInt(val, 10) : null;
}

async function setTripStartTimestamp(ts: number | null): Promise<void> {
  if (ts !== null) {
    await AsyncStorage.setItem(STORAGE_KEYS.TRIP_START_TS, String(ts));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.TRIP_START_TS);
  }
}

// ── Core logic ───────────────────────────────────────────────────────────────

async function handleLocationUpdate(
  loc: Location.LocationObject,
  appointmentId: string,
): Promise<void> {
  const speedMps = loc.coords.speed ?? 0;
  const speedKmh = mpsToKmh(Math.max(0, speedMps));
  const nowMs = Date.now();

  const activeTripId = await getActiveTripId();
  const isMoving = speedKmh >= MOVING_SPEED_KMH;

  if (isMoving) {
    // Reset the stationary timer whenever we're moving
    _stationaryStart = null;

    // Start a new trip if one isn't already running
    if (!activeTripId) {
      try {
        const res = await tripsApi.startTrip({
          appointment_id: appointmentId,
          start_lat: loc.coords.latitude,
          start_lng: loc.coords.longitude,
        });
        const trip = res.data.data;
        if (trip?.id) {
          await setActiveTripId(trip.id);
          await setTripStartTimestamp(nowMs);
          console.log('[TripAutoLog] Trip started:', trip.id);
        }
      } catch (err) {
        console.warn('[TripAutoLog] Failed to start trip:', err);
      }
    }
  } else {
    // Device appears stationary
    if (!_stationaryStart) {
      _stationaryStart = nowMs;
    }

    const stationaryDurationSec = (nowMs - _stationaryStart) / 1000;

    if (activeTripId && stationaryDurationSec >= STATIONARY_SECONDS) {
      // Check minimum trip duration before recording it
      const startTs = await getTripStartTimestamp();
      const tripDurationSec = startTs ? (nowMs - startTs) / 1000 : 0;

      if (tripDurationSec >= MIN_TRIP_SECONDS) {
        try {
          await tripsApi.endTrip(activeTripId, {
            end_lat: loc.coords.latitude,
            end_lng: loc.coords.longitude,
          });
          console.log('[TripAutoLog] Trip ended:', activeTripId);
        } catch (err) {
          console.warn('[TripAutoLog] Failed to end trip:', err);
        }
      }

      // Clear state regardless of whether the API call succeeded
      await setActiveTripId(null);
      await setTripStartTimestamp(null);
      _stationaryStart = null;
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Start automatic trip detection for a given appointment.
 * Call this when the technician starts travelling to a job.
 *
 * @param appointmentId  UUID of the active service appointment
 * @returns true if watching started successfully
 */
export async function startTripAutoLog(appointmentId: string): Promise<boolean> {
  if (_isRunning) return true;

  // Only start if permission is already granted — do not prompt automatically.
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    return false; // Silently skip — no unexpected dialog
  }

  // Store the appointment ID so the background handler can use it
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP_APPT, appointmentId);

  _subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: WATCH_INTERVAL_MS,
      distanceInterval: WATCH_DISTANCE_M,
    },
    (loc) => handleLocationUpdate(loc, appointmentId),
  );

  _isRunning = true;
  return true;
}

/**
 * Stop automatic trip detection.
 * Any in-progress trip is ended immediately with the last known location.
 */
export async function stopTripAutoLog(
  lastLat?: number,
  lastLng?: number,
): Promise<void> {
  _subscription?.remove();
  _subscription = null;
  _isRunning = false;
  _stationaryStart = null;

  // End any in-progress trip
  const activeTripId = await getActiveTripId();
  if (activeTripId) {
    try {
      await tripsApi.endTrip(activeTripId, {
        end_lat: lastLat,
        end_lng: lastLng,
      });
      console.log('[TripAutoLog] Trip force-ended on stop:', activeTripId);
    } catch { }
    await setActiveTripId(null);
    await setTripStartTimestamp(null);
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP_APPT);
}

/** Returns true if auto-logging is currently active. */
export function isTripAutoLogActive(): boolean {
  return _isRunning;
}

/** Returns the currently active auto-logged trip ID, or null. */
export async function getAutoLoggedTripId(): Promise<string | null> {
  return getActiveTripId();
}
