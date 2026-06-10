# WF-ONB-onboarding-setup — Complete Account Onboarding (Company Admin & Invited User)

## Module
Onboarding — `OnboardingSetupPage` (`/onboarding/setup`), `UserOnboardingPage` (`/onboarding/user-setup`)

## Prerequisites
- User must reach the page through a valid magic link and be authenticated (both routes are wrapped in `PrivateRoute`).
- If `user.onboarding_completed` is already `true`, the page redirects to `/dashboard` automatically — onboarding cannot be repeated.
- Both pages submit through the same hook (`useCompleteOnboarding`) which calls `PATCH /auth/magic/complete-onboarding`.

---

## Steps — Company Onboarding

Route `/onboarding/setup`. Title **"onboarding.welcome"** with subtitle **"onboarding.setupInstruction"**, and an info **Alert** (**"onboarding.alertMessage"**) at the top of the card. The form is a single screen (no multi-step wizard) with vertical layout.

1. **First Name** (`first_name`) — text input with a user icon prefix. Required; trimmed; 1–100 characters.
2. **Last Name** (`last_name`) — text input with a user icon prefix. Required; trimmed; 1–100 characters.
3. **New Password** (`new_password`) — password input with a lock icon prefix. Minimum 8 characters and must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.
4. **Confirm Password** (`confirm_password`) — password input with a lock icon prefix. Must match **New Password** exactly, otherwise validation fails with "passwords do not match".
5. Click **Complete Setup** (primary button, check icon, full width). The button shows a loading state while `completeOnboarding.isPending`.
6. On success the form submits `{ first_name, last_name, new_password }` via `useCompleteOnboarding`, updates the auth store user with the new first/last name, shows the success notification "Onboarding complete! Welcome aboard.", and navigates (replace) to `/dashboard`.
7. On error a notification shows the server message or "Failed to complete onboarding".

> Note: The company onboarding form does **not** include a phone field.

---

## Steps — User Onboarding

Route `/onboarding/user-setup`. Title **"userOnboarding.welcomeTitle"** with subtitle **"userOnboarding.subtitle"**, and an info **Alert** with both a message (**"userOnboarding.invitationMessage"**) and description (**"userOnboarding.invitationDescription"**). First/last name fields are pre-filled from the current auth store user if available. Single-screen vertical form (no multi-step wizard).

1. **First Name** (`first_name`) — text input with a user icon prefix; pre-filled from `user.first_name`. Required; trimmed; 1–100 characters.
2. **Last Name** (`last_name`) — text input with a user icon prefix; pre-filled from `user.last_name`. Required; trimmed; 1–100 characters.
3. **Phone (optional)** (`phone`) — text input with a phone icon prefix, placeholder "+1 555 000 0000". Optional; trimmed; up to 30 characters.
4. **Password** (`new_password`) — password input with a lock icon prefix. Minimum 8 characters and must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.
5. **Confirm Password** (`confirm_password`) — password input with a lock icon prefix. Must match **Password** exactly.
6. Click **Activate Account** (primary button, check icon, full width). The button shows a loading state while `completeOnboarding.isPending`.
7. On success the form submits `{ first_name, last_name, phone (or omitted if empty), new_password }` via `useCompleteOnboarding`, updates the auth store user with the new first/last name, shows the success notification "Onboarding complete! Welcome aboard.", and navigates (replace) to `/dashboard`.
8. On error a notification shows the server message or "Failed to complete onboarding".

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| Complete company onboarding | **Complete Setup** button (`/onboarding/setup`) | Authenticated (PrivateRoute) | `useCompleteOnboarding` → `PATCH /auth/magic/complete-onboarding` |
| Activate invited user account | **Activate Account** button (`/onboarding/user-setup`) | Authenticated (PrivateRoute) | `useCompleteOnboarding` → `PATCH /auth/magic/complete-onboarding` |
| Enter first name | **First Name** input | Authenticated | (sent in onboarding payload) |
| Enter last name | **Last Name** input | Authenticated | (sent in onboarding payload) |
| Enter phone (user onboarding only) | **Phone (optional)** input | Authenticated | (sent as `phone`, omitted if blank) |
| Set password | **New Password / Password** input | Authenticated | (sent as `new_password`) |
| Confirm password | **Confirm Password** input | Authenticated | (client-side match validation only) |
