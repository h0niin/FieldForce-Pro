# Magic Link Authentication (Hanin)

Users can now also register or log in using a "Magic Link" sent to their email.

---

# 👉[Video Demo](video-demo.mp4)

<video src="https://github.com/user-attachments/assets/206a0e9e-6dbf-4fa6-9494-b60300f7e32e"></video>

---

## How to Test

**Login Flow:**
1. User enters their email on the login page after selecting "Sign in with Magic Link".
2. The frontend calls `POST /api/auth/magic-link/request`.
3. The backend generates a secure UUID token, associates it with the existing user account, sets an expiration time (15 minutes), and sends an email. _(sent to server logs, for now)_
4. The user clicks the link (`/auth/verify?token=...`) in their email.
5. The frontend extracts the token from the URL and calls `POST /api/auth/magic-link/verify`.
6. The backend validates the token, marks it as used, creates a session, and sets authentication cookies.
7. The user is redirected to the dashboard.

**Registration Flow:**
1. A new user enters their details (except password) on the registration page after selecting "Register with Magic Link".
2. The frontend calls `POST /api/auth/magic-link/register`.
3. The backend creates the user (with no password), generates the token, and emails the user. _(sent to server logs, for now)_
4. The user verifies the token just like the login flow.

---

## Files Changed

### Backend Changes

#### 1. `server/src/models/User.ts`
- **Modified**: Changed `password_hash` to be nullable (`allowNull: true`).
- **Added**: Added `magic_link_token` (UUID) to store the generated token.
- **Added**: Added `magic_link_expires` (Date) to enforce token expiration.

#### 2. PostgreSQL Database Schema
- **Modified**: Dropped the `NOT NULL` constraint on the `password_hash` column in the `users` table to allow creating accounts solely via Magic Link.

#### 3. `server/src/auth/auth.service.ts`
- **Added `requestMagicLink(email)`**: Finds the user, generates a UUID token, sets the expiry to 15 minutes, saves to DB, and sends the magic link URL via `MailService`.
- **Added `requestMagicLinkRegister(dto)`**: Creates a new user record without a password, assigns the default Admin role, generates the magic link token, and sends the email.
- **Added `verifyMagicLink(token, ip, userAgent)`**: Validates that the token exists and is not expired. If valid, clears the token/expiry from the database, retrieves the user's roles, and delegates to `completeLogin()` to establish a standard session.

#### 4. `server/src/auth/auth.controller.ts`
- **Added Endpoint**: `POST /api/auth/magic-link/request` -> Triggers the login magic link.
- **Added Endpoint**: `POST /api/auth/magic-link/register` -> Triggers the registration magic link.
- **Added Endpoint**: `POST /api/auth/magic-link/verify` -> Exchanges the token for a session and sets the `access_token` and `refresh_token` HTTP-only cookies.

### Frontend Changes

#### 5. `web/src/api/auth.api.ts`
- **Added API Wrappers**: `requestMagicLink`, `requestMagicLinkRegister`, and `verifyMagicLink` using Axios to match the new backend endpoints.

#### 6. `web/src/hooks/use-auth.ts`
- **Added React Query Mutations**: Created `useRequestMagicLink()`, `useRegisterMagicLink()`, and `useVerifyMagicLink()`. 
- These handle success/error notifications natively and update the global `AuthStore` on successful verification.

#### 7. `web/src/pages/auth/LoginPage.tsx`
- **UI Update**: Added a toggle button "Sign in with Magic Link".
- **Logic**: Conditionally renders two distinct `<Form>` blocks (with distinct `key` attributes to avoid React component reuse issues) so users can either input a password or just an email to trigger `useRequestMagicLink()`.

#### 8. `web/src/pages/auth/RegisterPage.tsx`
- **UI Update**: Added a toggle button "Register with Magic Link".
- **Logic**: Removed the password field from the magic link form variant. Validates input using a modified Zod schema (`magicLinkSchema`) and submits via `useRegisterMagicLink()`.

#### 9. `web/src/pages/auth/VerifyMagicLinkPage.tsx` (New File)
- **New Component**: A dedicated page (`/auth/verify`) that displays a loading spinner upon load.
- **Logic**: Reads the `?token=...` parameter from the URL using `useSearchParams()`, fires `verifyMagicLinkMutation.mutate()`, and redirects the user to `/dashboard` upon successful session creation.

#### 10. `web/src/routes.tsx`
- **Added Route**: Inserted `/auth/verify` into the public router array, pointing to `<VerifyMagicLinkPage />`.

---

## API Contract

### `POST /api/auth/magic-link/request`
- **Request Body**: `{ "email": "user@example.com" }`
- **Response**: `200 OK` (Always returns success to prevent email enumeration, regardless of whether the email exists).

### `POST /api/auth/magic-link/register`
- **Request Body**: `{ "email": "...", "first_name": "...", "last_name": "...", "company_name": "...", "phone": "..." }`
- **Response**: `201 Created`
- **Errors**: `409 Conflict` if the email is already registered.

### `POST /api/auth/magic-link/verify`
- **Request Body**: `{ "token": "uuid-string" }`
- **Response**: `200 OK`
  - **Headers**: `Set-Cookie: access_token=...`, `Set-Cookie: refresh_token=...`
  - **Body**: Standard `{ user, tenant }` payload exactly like standard Login.
- **Errors**: `401 Unauthorized` if the token is invalid or expired.
