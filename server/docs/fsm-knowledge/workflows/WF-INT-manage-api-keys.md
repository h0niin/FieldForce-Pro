# WF-INT-manage-api-keys — Create, Revoke, and Delete API Keys

## Module
Integrations — `ApiKeysPage` (`/integrations/api-keys`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).

---

## Steps — View API Keys

1. In the left sidebar, click **API Keys** (under Integrations). The browser navigates to `/integrations/api-keys`.
2. The page header reads **"API Keys"** with subtitle "Manage API keys for external integrations and inbound service requests".
3. The table shows columns: **Name**, **Key Prefix** (e.g., `abc123…`), **Scopes** (blue tags), **Status** (Active green / Revoked red), **Last Used**, **Expires**, **Actions**.

---

## Steps — Create an API Key

1. Click the **Create API Key** button (PlusOutlined, primary) in the page header.
2. A modal opens with title **"Create API Key"** (KeyOutlined icon).
3. Fill in the form:
   - **Key Name** (required; placeholder: "e.g. Production Integration, CRM Sync"; validation: "Please enter a name").
   - **Scopes** (optional Checkbox group; available scopes: `service_requests:read`, `service_requests:write`, `work_orders:read`, `work_orders:write`, `contacts:read`, `contacts:write`, `invoices:read`, `invoices:write`).
   - **Expiry Date** (optional DatePicker; past dates disabled).
4. Click **Create** (loading while `createApiKey.isPending`). On success, the modal closes.
5. A second modal **"Save Your API Key"** immediately appears with:
   - Warning alert: "This key will only be shown once. Copy and store it securely."
   - The raw API key displayed in a code block.
   - A **Copy** button (CopyOutlined) to copy to clipboard.
6. Click **"I've saved it"** to dismiss the modal.

---

## Steps — Revoke an API Key

### Prerequisite
- The API key must be **Active** (`is_active = true`). The **Revoke** button only appears for active keys.

1. In the **Actions** column, click the **Revoke** icon button (StopOutlined, tooltip: "Revoke").
2. A confirmation dialog appears:
   - **Title**: "Revoke API Key"
   - **Content**: `Revoke "{record.name}"? Any integrations using this key will stop working immediately.`
   - Danger-styled confirmation button.
3. Click **OK** to confirm. `revokeApiKey.mutateAsync(record.id)` is called.
4. Click **Cancel** to abort.
5. On success, the Status column changes from **Active** (green) to **Revoked** (red).

---

## Steps — Delete an API Key

1. In the **Actions** column, click the **Delete** icon button (DeleteOutlined, danger, tooltip: "Delete").
2. A confirmation dialog appears:
   - **Title**: "Delete API Key"
   - **Content**: `Permanently delete "{record.name}"? This cannot be undone.`
   - Danger-styled confirmation button.
3. Click **OK** to confirm. `deleteApiKey.mutateAsync(record.id)` is called.
4. Click **Cancel** to abort.

---

## Available Scopes Reference

| Scope | Description |
|---|---|
| `service_requests:read` | Read service requests |
| `service_requests:write` | Create/update service requests |
| `work_orders:read` | Read work orders |
| `work_orders:write` | Create/update work orders |
| `contacts:read` | Read contacts |
| `contacts:write` | Create/update contacts |
| `invoices:read` | Read invoices |
| `invoices:write` | Create/update invoices |

---

## Actions Summary

| Action | Button | Permission | API |
|---|---|---|---|
| View API keys | Sidebar **API Keys** | Authenticated | `useApiKeys` |
| Create API key | **Create API Key** | Authenticated | `useCreateApiKey` |
| Revoke API key | **Revoke** icon | Authenticated | `useRevokeApiKey` |
| Delete API key | **Delete** icon | Authenticated | `useDeleteApiKey` |
| Copy key to clipboard | **Copy** icon | Authenticated | `navigator.clipboard.writeText()` |
