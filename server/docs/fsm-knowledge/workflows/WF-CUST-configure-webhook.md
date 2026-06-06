# WF-CUST-configure-webhook

## Module
Customization > Webhooks

## Routes
- List: `/customization/webhooks`
- Create: `/customization/webhooks/new` (renders `WebhookFormPage` with `isEdit = false`)
- Edit: `/customization/webhooks/:id/edit` (renders `WebhookFormPage` with `isEdit = true`)

## Sidebar Navigation
The "Automation & Customization" section and its "Webhooks" child item are commented out in `Sidebar.tsx`. Navigate directly to `/customization/webhooks`.

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- **Create Webhook** button is wrapped in `PermissionGuard permission="webhooks:create"`. The button is hidden unless the user holds this permission.
- **View** (EyeOutlined, tooltip "View") action button requires `webhooks:read`.
- **Edit** (EditOutlined, tooltip "Edit") action button requires `webhooks:update`.
- **Delete** (DeleteOutlined, tooltip "Delete") action button requires `webhooks:delete`.
- The **Status** toggle Switch in the list table is not additionally permission-guarded beyond page access.

---

## Page: Webhooks List (`/customization/webhooks`)

Page header title: **Webhooks**  
Page header subtitle: "Outbound webhook subscriptions for event notifications"

### Filters available

- **Search** text input (placeholder "Search webhooks...") — debounced 500 ms, resets to page 1.

### Table columns
`Name` | `URL` | `Events` | `Status` | `Last Triggered` | `Actions`

- **Events** column: shows up to 3 event tags (blue); if more, a count tag `+N` is shown.
- **Status** column: Switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`) — toggles immediately via `useUpdateWebhook`.
- **Last Triggered** column: formatted datetime, or "Never" (grey) if null.
- `Name` and `Last Triggered` columns are sortable.

---

## Steps: Create a Webhook

1. Navigate to `/customization/webhooks`.
2. Click **Create Webhook** (primary button, PlusOutlined icon; requires `webhooks:create` permission). The browser navigates to `/customization/webhooks/new`.
3. The page **Create Webhook** (page header; onBack navigates to `/customization/webhooks`) loads with an empty form.
4. Fill in **Name** (required text input; placeholder "e.g. Zapier Integration"; validation: "Please enter a name").
5. Fill in **Webhook URL** (required text input; placeholder "https://hooks.zapier.com/hooks/catch/..."; validations: "Please enter webhook URL" and "Please enter a valid URL").
6. Fill in **Events (JSON Array)** (required TextArea; monospace font; 6 rows; placeholder `["work_order.created", "work_order.updated", "invoice.paid"]`; hint text: "List of events to trigger this webhook"). The field validates:
   - Valid JSON: error "Invalid JSON format"
   - Value must be an array: error "Events must be an array"
7. Optionally fill in **Secret Key** (password input; placeholder "Enter secret key (optional)"; hint: "Used to sign webhook payloads for verification").
8. Toggle **Active** Switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`; default: Active/checked).
9. Click **Create** (primary button; loading while `createWebhook.isPending`). On success, navigates to `/customization/webhooks`.
10. Click **Cancel** to discard and navigate to `/customization/webhooks`.

---

## Steps: Edit a Webhook

1. Navigate to `/customization/webhooks`.
2. Locate the target webhook in the table.
3. Click the **Edit** icon button (EditOutlined, tooltip "Edit"; requires `webhooks:update`). Navigates to `/customization/webhooks/:id/edit`.
4. While the record loads, a `Skeleton` is displayed under the page header "Loading...".
5. The form **Edit Webhook** pre-populates: Name, Webhook URL, Events (serialised as JSON array string), Secret Key, Active.
6. Make changes.
7. Click **Update** (primary button; loading while `updateWebhook.isPending`). On success, navigates to `/customization/webhooks`.
8. Click **Cancel** to discard and navigate to `/customization/webhooks`.

---

## Steps: View a Webhook

1. In the list table, click the **View** icon button (EyeOutlined, tooltip "View"; requires `webhooks:read`). Navigates to `/customization/webhooks/:id`.

---

## Steps: Toggle Webhook Active Status

1. In the **Status** column of any row, click the Switch to toggle `Active` / `Inactive`.
2. `useUpdateWebhook` fires immediately with `{ id, is_active: <new value> }`. No confirmation dialog is shown.

---

## Steps: Delete a Webhook

1. In the list table, click the **Delete** icon button (DeleteOutlined, danger/red, tooltip "Delete"; requires `webhooks:delete`).
2. A confirmation dialog appears:
   - Title: **Delete Webhook**
   - Body: `Are you sure you want to delete "{webhook.name}"?`
3. Click **OK** to confirm; `deleteWebhook.mutateAsync(record.id)` is called.
4. Click **Cancel** to abort.

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Search | Text input onChange (debounced) | Filters list; resets to page 1 |
| Navigate to Create form | Click "Create Webhook" | Navigates to `/customization/webhooks/new` |
| Navigate to Edit form | Click EditOutlined (tooltip "Edit") | Navigates to `/customization/webhooks/:id/edit` |
| Navigate to View detail | Click EyeOutlined (tooltip "View") | Navigates to `/customization/webhooks/:id` |
| Toggle Status inline | Click Switch in Status column | Calls useUpdateWebhook with { id, is_active } immediately |
| Open delete confirmation | Click DeleteOutlined (tooltip "Delete") | showConfirmDialog "Delete Webhook" |
| Confirm deletion | Click "OK" in dialog | deleteWebhook.mutateAsync(id) |
| Submit Create form | Click "Create" | createWebhook.mutateAsync; navigates to list on success |
| Submit Edit form | Click "Update" | updateWebhook.mutateAsync; navigates to list on success |
| Cancel form | Click "Cancel" | Navigates to `/customization/webhooks` without saving |
| Back from form | Click back arrow (PageHeader onBack) | Navigates to `/customization/webhooks` |
| Sort by Name | Click Name column header | Client-side sort ascending/descending |
| Sort by Last Triggered | Click Last Triggered column header | Client-side sort ascending/descending |
