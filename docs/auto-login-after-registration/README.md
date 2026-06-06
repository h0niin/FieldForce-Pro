# Auto-Login after Registration (Hanin)

Users are now **automatically signed in after registration**, without being taken back to the login page again.

---

# 👉[Video Demo](video-demo.mp4)

<video src="https://github.com/user-attachments/assets/6481e860-afe1-410b-a6b7-c7c9276f12c4"></video>

---

## Problem (Before)

The web app already behaved as if registration logged the user in:

- in [`web/src/hooks/use-auth.ts`](../../web/src/hooks/use-auth.ts), `useRegister()` called `login(data.user)` on success
- and [`web/src/pages/auth/RegisterPage.tsx`](../../web/src/pages/auth/RegisterPage.tsx) navigated to `/dashboard` after register

But, `POST /auth/register` only:

1. Created tenant, user, admin role and permissions
2. Returned JSON: `{ user, tenant }`
3. Did **not** issue JWT tokens or set cookies

So after register:

1. Background `useMe()` called `GET /auth/me` -> **401** (bcs no cookies)
2. User was logged out and redirected to **`/login`**

## Solution (After)

After creating the account, registration calls the same **`completeLogin()`** path used by a successful password login:

- Creates a row in `login_sessions`.
- Issues access and refresh JWTs.
- Loads roles and permissions onto the user object.
- Updates `last_login_at`.

The controller sets cookies and strips tokens from the JSON body (identical to login).

### MFA note

`register()` does **not** go through `login()`’s MFA branch. Since new accounts have `mfa_enabled: false` by default, they receive a full session immediately. MFA still applies on subsequent logins if enabled later.

---

## Files Changed

### 1. `server/src/auth/auth.service.ts`

- `register(dto)` -> `register(dto, ip, userAgent)`.
- After role assignment, reloads user with `findById()` (includes roles).
- Calls `completeLogin(userWithRoles, loginDto, ip, userAgent)`.
- Returns `{ ...session, tenant }` where `session` includes `access_token`, `refresh_token`, and `user` (with `roles` / `permissions`).

### 2. `server/src/auth/auth.controller.ts`

- `register` accepts `@Req()` / `@Res({ passthrough: true })` for IP, user-agent, and cookies.
- Sets auth cookies via `setAuthCookies()`.
- Returns stripped body via `stripTokensFromAuthResult()`.
- Extracted private helpers:
  - `setAuthCookies(res, result)`
  - `stripTokensFromAuthResult(result)`
- `login` and `verify-mfa` refactored to use the same helpers (behavior unchanged for MFA path).

### 3. `web/src/hooks/use-auth.ts`

- `useRegister` `onSuccess`: if `data.user` is missing, show an error and **do not** call `login()`.

## API Contract

### `POST /api/auth/register`

**Request** - unchanged (`RegisterDto`):

- `email`, `password`, `first_name`, `last_name`, `company_name`, `phone?`

**Response** - `201 Created`

**Headers**

- `Set-Cookie: access_token=...` (HTTP-only)
- `Set-Cookie: refresh_token=...` (HTTP-only)

**Body** (`DataResponseDto`):

```json
{
  "statusCode": 201,
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "...",
      "first_name": "...",
      "last_name": "...",
      "tenant_id": "uuid",
      "roles": ["Admin"],
      "permissions": ["..."]
    },
    "tenant": {
      "id": "uuid",
      "name": "Company Name"
    }
  }
}
```

**Not in body:** `access_token`, `refresh_token` (cookies only).

**Errors** - unchanged:

- `409` - email already exists
- `400` - validation errors

---

## Frontend Behavior

| Step | Component | Action |
|------|-----------|--------|
| 1 | `RegisterPage` | Submit form -> `useRegister().mutate()` |
| 2 | `auth.api.ts` | `POST /auth/register` with credentials |
| 3 | `useRegister` | `login(user)` + success toast |
| 4 | `RegisterPage` | `navigate('/dashboard')` |
| 5 | `PrivateRoute` | Allows access if `isAuthenticated` |
| 6 | `useMe` | `GET /auth/me` with cookies → validates session |

No changes required to [`web/src/pages/auth/RegisterPage.tsx`](../../web/src/pages/auth/RegisterPage.tsx) for auto-login; it already redirected to the dashboard.

---

## How to Test

### account creation

1. Open `/register` (Vite or Docker web).
2. Fill form with a **new** email and valid password (uppercase, lowercase, number, special char).
3. Submit.
4. Expect:
   - Toast: “Account created successfully”
   - Redirect to `/dashboard`
   - No redirect back to `/login`
5. Refresh page - still authenticated (`useMe` + cookies).
6. DevTools -> Application → Cookies - `access_token` and `refresh_token` for localhost.

### duplicate email

- Register same email twice -> `409` / “Registration failed” - no partial session.

### curl (API only)

```bash
curl -i -X POST http://127.0.0.1:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "TestPass1!",
    "first_name": "Test",
    "last_name": "User",
    "company_name": "Test Co"
  }'
```

Expect `201`, `Set-Cookie` headers, and JSON `data.user` without tokens in the body.

---

## Security & Edge Cases

| Topic | Behavior |
|-------|----------|
| **Password in `completeLogin` DTO** | Empty string on register; password not re-validated (user was just created). |
| **MFA on register** | Skipped; new users are not MFA-enabled by default. |
| **Token exposure** | Tokens only in HTTP-only cookies, not in API JSON. |
| **Session fixation** | New session created per registration (new `session_id`). |
| **Permissions** | Admin role gets all permissions at register time (existing behavior). |
| **Partial failure** | If `completeLogin` fails after user create, account exists but no session — frontend shows error if `user` missing; user should use login. Consider transaction wrap in a future improvement. |
