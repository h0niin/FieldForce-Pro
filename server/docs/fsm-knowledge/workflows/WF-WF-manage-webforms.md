# WF-WF-manage-webforms — Create, Edit, Toggle, Delete, and Embed Webforms

## Module
Webforms — `WebformListPage` (`/webforms`), `WebformFormPage` (`/webforms/new`, `/webforms/:id/edit`), `WebformDetailPage` (`/webforms/:id`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).

---

## Steps — View Webform List

1. In the left sidebar, click **Webforms**. The browser navigates to `/webforms`.
2. The page header reads **"Webforms"** with subtitle "Create and manage customer-facing web forms".
3. A **Search** input (placeholder: "Search webforms...") allows filtering by name (debounced 500ms).
4. The table shows columns: **Name**, **Description**, **Submissions** (count), **Status** (Active/Inactive switch), **Last Updated**, **Actions**.
5. Pagination shows total count and page size selector.

---

## Steps — Create a Webform

1. On the Webforms list page, click **Create Webform** (PlusOutlined, primary button; requires `webforms:create`).
2. The browser navigates to `/webforms/new`.
3. Fill in the webform creation form.
4. Submit to create the webform.

---

## Steps — View Webform Detail

1. In the **Actions** column, click the **View** icon button (EyeOutlined, tooltip: "View"; requires `webforms:read`).
2. The browser navigates to `/webforms/:id`.

---

## Steps — Edit a Webform

1. In the **Actions** column, click the **Edit** icon button (EditOutlined, tooltip: "Edit"; requires `webforms:update`).
2. The browser navigates to `/webforms/:id/edit`.
3. Make changes and submit.

---

## Steps — Toggle Webform Active Status

1. In the **Status** column, click the **Switch** toggle.
   - Switch labels: `checkedChildren="Active"` / `unCheckedChildren="Inactive"`.
2. `updateWebform.mutateAsync({ id: record.id, is_active: checked })` fires immediately. No confirmation dialog.

---

## Steps — Get Embed Code

1. In the **Actions** column, click the **Embed Code** icon button (CodeOutlined, tooltip: "Embed Code"; requires `webforms:read`).
2. The browser navigates to `/webforms/:id/embed`.

---

## Steps — Delete a Webform

1. In the **Actions** column, click the **Delete** icon button (DeleteOutlined, danger, tooltip: "Delete"; requires `webforms:delete`).
2. A confirmation dialog appears:
   - **Title**: "Delete Webform"
   - **Content**: `Are you sure you want to delete "{record.name}"?`
   - Danger-styled confirmation button.
3. Click **OK** to confirm. `deleteWebform.mutateAsync(record.id)` is called.
4. Click **Cancel** to abort.

---

## Actions Summary

| Action | Button | Permission | API |
|---|---|---|---|
| View webform list | Sidebar **Webforms** | Authenticated | `useWebforms` |
| Create webform | **Create Webform** | `webforms:create` | Navigate to `/webforms/new` |
| View webform detail | **View** icon | `webforms:read` | Navigate to `/webforms/:id` |
| Edit webform | **Edit** icon | `webforms:update` | Navigate to `/webforms/:id/edit` |
| Toggle active | Status **Switch** | Authenticated | `useUpdateWebform` |
| Get embed code | **Embed Code** icon | `webforms:read` | Navigate to `/webforms/:id/embed` |
| Delete webform | **Delete** icon | `webforms:delete` | `useDeleteWebform` |
