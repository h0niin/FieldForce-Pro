# WF-SET-connect-payment-gateway

## Module
Settings > Payment Gateway Settings

## Route
`/settings/payment-gateways`

## Sidebar Navigation
This route is registered in `routes.tsx` but the corresponding sidebar child item (`Payment Gateways`) is commented out in `Sidebar.tsx`. Navigate directly to `/settings/payment-gateways` or use the Settings submenu if the item is re-enabled.

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- The Settings submenu requires the `settings:read` permission.
- No gateway-level permission guard is implemented on this page; any authenticated user who can reach the route can view and save gateway settings.
- A global banner "Security Notice" / "All API keys and secrets are encrypted and stored securely. Never share your production keys." is always displayed at the top of the page (closable Alert, type "warning").

---

## Page Layout

The page title is **Payment Gateway Settings** (subtitle: "Configure payment processors and gateways"). A `Tabs` component with `defaultActiveKey="stripe"` presents four gateways:

| Tab key | Tab label |
|---|---|
| `stripe` | Stripe (shows an "Active" tag when Stripe is enabled) |
| `square` | Square |
| `paypal` | PayPal |
| `authorize` | Authorize.Net |

---

## Steps: Configure Stripe

1. Navigate to `/settings/payment-gateways`.
2. The **Stripe** tab is active by default.
3. An Alert banner shows either:
   - "Stripe is enabled and configured" (success style, when `enabled` is true), or
   - "Stripe is disabled" (warning style, when `enabled` is false).
4. Toggle **Enable Stripe** Switch (`checkedChildren="Enabled"` / `unCheckedChildren="Disabled"`) to enable or disable Stripe.
5. Toggle **Test Mode** Switch (`checkedChildren="Test"` / `unCheckedChildren="Live"`) to switch between Stripe test and live environments.
6. Enter the **Publishable Key** (password input; placeholder `pk_test_...`; required: "API key is required").
7. Enter the **Secret Key** (password input; placeholder `sk_test_...`; required: "Secret key is required").
8. Optionally enter the **Webhook Secret** (password input; placeholder `whsec_...`).
9. Select the **Default Currency** from the dropdown:
   - `USD - US Dollar`
   - `EUR - Euro`
   - `GBP - British Pound`
   - `CAD - Canadian Dollar`
   - `AUD - Australian Dollar`
10. Toggle **Auto Capture** Switch (`checkedChildren="Auto Capture"` / `unCheckedChildren="Manual Capture"`).
11. Click **Save Stripe Settings** (primary button with SaveOutlined icon; shows loading spinner while saving).
12. On success: notification "Stripe settings saved successfully" appears.
13. On failure: notification "Failed to save settings" appears.

---

## Steps: Configure Square

1. Click the **Square** tab.
2. An info Alert "Square Integration" / "Configure your Square payment gateway settings" is displayed.
3. Toggle **Enable Square** Switch (`checkedChildren="Enabled"` / `unCheckedChildren="Disabled"`).
4. Toggle **Sandbox Mode** Switch (`checkedChildren="Sandbox"` / `unCheckedChildren="Production"`).
5. Enter the **Application ID** (password input; placeholder `sq0idp-...`).
6. Enter the **Access Token** (password input; placeholder "Enter your Square access token").
7. Enter the **Location ID** (text input; placeholder "Enter your Square location ID").
8. Click **Save Square Settings** (primary button with SaveOutlined icon).
9. On success: notification "Square settings saved successfully" appears.

---

## Steps: Configure PayPal

1. Click the **PayPal** tab.
2. An info Alert "PayPal Integration" / "Configure your PayPal payment gateway settings" is displayed.
3. Toggle **Enable PayPal** Switch (`checkedChildren="Enabled"` / `unCheckedChildren="Disabled"`).
4. Toggle **Sandbox Mode** Switch (`checkedChildren="Sandbox"` / `unCheckedChildren="Live"`).
5. Enter the **Client ID** (password input; placeholder "Enter your PayPal client ID").
6. Enter the **Client Secret** (password input; placeholder "Enter your PayPal client secret").
7. Click **Save PayPal Settings** (primary button with SaveOutlined icon).
8. On success: notification "PayPal settings saved successfully" appears.

---

## Steps: Configure Authorize.Net

1. Click the **Authorize.Net** tab.
2. An info Alert "Authorize.Net Integration" / "Configure your Authorize.Net payment gateway settings" is displayed.
3. Toggle **Enable Authorize.Net** Switch (`checkedChildren="Enabled"` / `unCheckedChildren="Disabled"`).
4. Toggle **Sandbox Mode** Switch (`checkedChildren="Sandbox"` / `unCheckedChildren="Production"`).
5. Enter the **API Login ID** (text input; placeholder "Enter your API Login ID").
6. Enter the **Transaction Key** (password input; placeholder "Enter your transaction key").
7. Click **Save Authorize.Net Settings** (primary button with SaveOutlined icon).
8. On success: notification "Authorize.Net settings saved successfully" appears.

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Switch tab | Click tab label | Renders the selected gateway's form |
| Toggle Enable switch | onClick Switch | Updates enabled state in form |
| Toggle Test/Sandbox Mode switch | onClick Switch | Updates test_mode state in form |
| Toggle Auto Capture (Stripe only) | onClick Switch | Updates auto_capture state in form |
| Save Stripe Settings | Click "Save Stripe Settings" | handleSaveStripe: simulated API call, success/error notification |
| Save Square Settings | Click "Save Square Settings" | handleSaveSquare: simulated API call, success notification |
| Save PayPal Settings | Click "Save PayPal Settings" | handleSavePayPal: simulated API call, success notification |
| Save Authorize.Net Settings | Click "Save Authorize.Net Settings" | handleSaveAuthorize: simulated API call, success notification |
| Dismiss Security Notice | Click close (x) on Alert | Hides the global security banner |
