# WF-PB-delete-pricebook-item.md — Delete a Pricebook Item

## Overview
This workflow covers deleting a pricebook item from the Pricebook list page.

## Prerequisites
- User must have the `pricebook:delete` permission. The Delete (DeleteOutlined) icon button on the list is wrapped in `PermissionGuard permission="pricebook:delete"`. It is hidden if the user lacks this permission.

---

## Steps

1. Open the **Pricebook** page (its list page title is "Pricebook"). *(Note: Pricebook is not currently shown in the main sidebar menu — open it via a direct link or ask your administrator to enable it.)*
2. The Pricebook list page loads with the subtitle "Manage tiered pricing for services (Good/Better/Best)".
3. Locate the desired pricebook item row in the table.
4. In the **Actions** column, click the icon-only danger button with tooltip **Delete** (DeleteOutlined icon, rendered in red danger style).
   - This button is wrapped in `PermissionGuard permission="pricebook:delete"`. It is hidden if the user lacks `pricebook:delete`.
5. A confirmation dialog appears:
   - Title: **Delete Pricebook Item**
   - Content: `Are you sure you want to delete "{record.name}"?` (the actual item name is interpolated)
   - Dialog is in danger mode (destructive confirmation styling).
6. Click **OK** to confirm deletion.
   - `deletePricebookItem.mutateAsync(record.id)` is called.
   - The item is removed from the list on success.
7. Click **Cancel** to abort. The item is not deleted and the user remains on the Pricebook list.

---

## Also Available From

The Pricebook View page (`/pricebook/{id}`) has a **View** (EyeOutlined) action guarded by `PermissionGuard permission="pricebook:read"`. No delete action is present on the view page itself — deletion is only available from the list.
