# Biometric Authentication — Implementation Guide

## Overview

FieldForce Pro supports biometric login using **Face ID** (iOS), **Face Recognition** (Android), and **Fingerprint** on both platforms. The implementation uses `expo-local-authentication` to interface with the device's native biometric APIs. Biometric login is an optional, opt-in feature layered on top of the standard email/password session.

---

## Library

| Package | Version | Purpose |
|---------|---------|---------|
| `expo-local-authentication` | SDK 54 compatible | Hardware biometric check, enrollment check, OS prompt |

---

## Architecture

The biometric system has two distinct use cases:

```
Use Case 1 — Cold Start (app launched, session still valid)
  isAuthenticated=true + biometricEnabled=true + biometricVerified=false
  → Redirect to biometric-lock screen
  → OS prompt fires automatically
  → Pass: biometricVerified=true → navigate to home
  → Fail: user taps "Use Password Instead" → logout() → redirect to login

Use Case 2 — Login Page (after logout, session expired)
  isAuthenticated=false + biometricEnabled=true + refreshToken preserved
  → Login page shows biometric-first view
  → OS prompt fires automatically
  → Pass: call /auth/refresh with stored refreshToken → loginWithVerification()
  → Fail x3: automatically show email/password form
```

---

## Files

### `src/hooks/use-biometric.ts`

Custom hook that wraps `expo-local-authentication`. Responsible for:

- Checking whether the device has biometric hardware (`hasHardwareAsync`)
- Checking whether the user has enrolled biometrics (`isEnrolledAsync`)
- Detecting the biometric type to label buttons correctly
- Exposing an `authenticate()` function that triggers the OS native prompt
- Exposing `isChecking` so UI can wait before rendering to avoid flash

**Type detection priority:**
1. `FACIAL_RECOGNITION` → `"Face ID"` on iOS, `"Face Recognition"` on Android
2. `FINGERPRINT` → `"Fingerprint"` on both platforms

Face recognition is checked first so it is used as the primary label when both are enrolled on the device.

```ts
interface BiometricState {
  isAvailable: boolean;    // device has enrolled biometrics
  isChecking: boolean;     // still checking hardware (gate for UI rendering)
  biometricType: string;   // "Face ID" | "Face Recognition" | "Fingerprint" | "Biometrics"
  authenticate: (reason: string) => Promise<boolean>;
}
```

---

### `src/store/auth.store.ts`

Zustand store (persisted via AsyncStorage) with the following biometric-related fields:

| Field | Persisted | Description |
|-------|-----------|-------------|
| `biometricEnabled` | Yes | User opted into biometric login |
| `biometricVerified` | No | Biometric passed this session (resets on every app launch) |

**Key actions:**

- `setBiometricEnabled(enabled)` — toggled after the user opts in from the post-login prompt
- `setBiometricVerified(verified)` — called by the biometric-lock screen after a successful scan
- `loginWithVerification(user, accessToken, refreshToken)` — atomically sets `isAuthenticated: true` AND `biometricVerified: true` in a single state update, preventing the router from briefly seeing `isBiometricLocked=true`

**Soft logout** — when `biometricEnabled=true`, `logout()` preserves `user` and `refreshToken` so the login page can offer biometric re-authentication. `accessToken` and `isAuthenticated` are always cleared regardless.

```ts
logout: () => set((state) => ({
  user: state.biometricEnabled ? state.user : null,
  accessToken: null,
  refreshToken: state.biometricEnabled ? state.refreshToken : null,
  isAuthenticated: false,
  biometricVerified: false,
}))
```

---

### `app/_layout.tsx`

Root layout that handles all routing decisions.

**Hydration guard** — Zustand's AsyncStorage rehydration is async. Without waiting for it, the app briefly renders the login screen on every cold start (because `isAuthenticated` starts as `false` before persisted state loads). The splash screen is held open until `onFinishHydration` fires.

```ts
const [storeHydrated, setStoreHydrated] = useState(useAuthStore.persist.hasHydrated());
useEffect(() => {
  const unsubscribe = useAuthStore.persist.onFinishHydration(() => setStoreHydrated(true));
  return unsubscribe;
}, []);
useEffect(() => {
  if (storeHydrated) SplashScreen.hideAsync();
}, [storeHydrated]);
```

**Biometric lock routing:**

```ts
const isBiometricLocked = isAuthenticated && biometricEnabled && !biometricVerified;

if (isBiometricLocked && !onBiometricLock) {
  router.replace('/(auth)/biometric-lock');
} else if (!isAuthenticated && !inAuthGroup) {
  router.replace('/(auth)/login');
} else if (isAuthenticated && !isBiometricLocked && inAuthGroup) {
  router.replace('/(tabs)/home');
}
```

---

### `app/(auth)/biometric-lock.tsx`

Screen shown on every cold start when the session is valid but biometric has not yet been verified this session.

- Auto-triggers the OS biometric prompt on mount via `useEffect`
- On success: calls `setBiometricVerified(true)` — the router in `_layout.tsx` then navigates to `/(tabs)/home`
- On failure: shows "Verification failed. Please try again." with a retry button
- **"Use Password Instead"**: calls `logout()` — the router redirects to `/(auth)/login`
- No API call is made on this screen — it only gates access to an already-valid session

---

### `app/(auth)/login.tsx`

Login screen with an automatic biometric-first flow.

**Flow on page load:**

1. `isChecking` from `useBiometric` prevents any render until hardware detection completes
2. If `canUseBiometric` (device available + user opted in + refreshToken exists), the biometric view is shown
3. The OS face/fingerprint prompt fires automatically — no button press needed
4. `"Looking for your face…"` status is shown while the prompt is active

**Failure handling:**

| Attempt | Behaviour |
|---------|-----------|
| 1st fail | Status: "Not recognised. 2 attempts remaining." + Try Again button |
| 2nd fail | Status: "Not recognised. 1 attempt remaining." + Try Again button |
| 3rd fail | Automatically switches to email/password form |

After 3 failures the password form appears silently — no alert, no extra tap required.

**`canUseBiometric` condition:**
```ts
const canUseBiometric = isAvailable && biometricEnabled && refreshToken !== null;
```
`refreshToken !== null` ensures the button is only shown when there is a stored token to refresh — i.e. the user had previously logged in and chose a soft logout.

**On biometric success:**
Calls `POST /auth/refresh` with the stored refresh token to obtain fresh tokens, then calls `loginWithVerification()` to atomically set the authenticated + verified state.

**Post-password-login enrollment prompt:**
After a successful email/password login, if biometrics are available but not yet enabled, an Alert asks the user if they want to enable biometric login for future sessions.

---

### `app/(tabs)/profile.tsx`

**Conditional server-side logout:**

When `biometricEnabled=true`, the server's `POST /auth/logout` endpoint is **not** called on logout. This keeps the refresh token valid on the server so it can be reused for biometric re-authentication on the next visit.

When `biometricEnabled=false`, the server logout is called normally, fully invalidating the session.

```ts
if (!biometricEnabled) {
  try { await authApi.logout(); } catch {}
}
logout(); // always runs local soft/full logout
```

---

### `app.json`

Native permission configuration required for biometrics to work.

**iOS:**
```json
"infoPlist": {
  "NSFaceIDUsageDescription": "Allow FieldForce Pro to use Face ID to sign in securely."
}
```
`NSFaceIDUsageDescription` is required by Apple — without it, iOS silently blocks Face ID calls entirely.

**Android:**
```json
"permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT"]
```

**Plugin:**
```json
["expo-local-authentication", {
  "faceIDPermission": "Allow FieldForce Pro to use Face ID to sign in securely."
}]
```
The plugin is required for `expo prebuild` to inject the native permission strings into the generated iOS/Android projects.

> **Note:** Any change to `app.json` requires a native rebuild:
> ```bash
> npx expo prebuild --clean
> npx expo run:android   # or npx expo run:ios
> ```

---

## OS Behaviour Note

`expo-local-authentication` delegates the actual authentication UI entirely to the operating system. When a device has both face recognition and fingerprint enrolled:

- **Android** — the OS BiometricPrompt dialog presents both methods together. The user can switch between them inside the native dialog. This is OS-controlled and cannot be overridden from JavaScript.
- **iOS** — Face ID is attempted first. If it fails, the user is offered the device passcode. Fingerprint (Touch ID) is only present on older iPhones that lack Face ID.

Our code fires the prompt labelled as "Face Recognition" / "Face ID" to signal intent, but the OS makes the final decision on which sensors to activate.

---

## State Flow Diagram

```
App Launch
    │
    ▼
Store hydrated?
    ├─ No  → hold splash screen
    └─ Yes → hide splash screen
                │
                ▼
         isAuthenticated?
                ├─ No  ──────────────────────────────► Login screen
                │                                          │
                │                              canUseBiometric?
                │                                   ├─ Yes → auto-trigger OS prompt
                │                                   │          ├─ Pass → /auth/refresh → home
                │                                   │          └─ Fail x3 → password form
                │                                   └─ No  → password form only
                │
                └─ Yes
                        │
                        ▼
               biometricEnabled && !biometricVerified?
                        ├─ Yes → biometric-lock screen
                        │           ├─ Pass → setBiometricVerified(true) → home
                        │           └─ Fail → "Use Password Instead" → logout() → login
                        └─ No  → home tabs
```

---

## Enabling / Disabling Biometrics

| Action | How |
|--------|-----|
| Enable | After first successful password login, tap "Enable" in the Alert prompt |
| Disable | Currently only possible by clearing app data. A Settings toggle can be added. |
| Re-enable | Log in with password again — the enrollment Alert will reappear if `biometricEnabled=false` |
