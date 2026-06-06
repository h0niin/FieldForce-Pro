# WF-ASSET-delete-asset

## Action: Delete an asset

### Prerequisites:
- User must have the permission `assets:delete`. If this permission is absent:
  - The "Delete" icon button (tooltip: "Delete") is not rendered in the Actions column of the list page.
  - The "Delete" button is not rendered on the detail page.

### Steps — from the List Page:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Locate the asset row in the table.
3. In the "Actions" column, click the icon button with tooltip **"Delete"** (`DeleteOutlined` icon, `danger` variant, text size small). This button is visible only when the user holds `assets:delete` permission.
4. A confirmation dialog opens with:
   - Title: **Delete Asset**
   - Content: `Are you sure you want to delete {asset.name}?`
   - The dialog is flagged as `danger: true` (the confirm button is styled as a destructive action).
5. Click the confirm button in the dialog to proceed.
   - The `deleteAsset.mutateAsync(asset.id)` mutation is called.
   - On success, the asset list refreshes (TanStack Query invalidation performed by the mutation hook).
   - On error, the error is handled by the mutation hook.
6. To cancel without deleting, click the cancel button in the dialog. No changes are made.

### Steps — from the Detail Page:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Navigate to the asset detail page (`/assets/{id}`).
3. Click the **Delete** button (`DeleteOutlined` icon, `danger` variant) in the page header actions area. This button is visible only when the user holds `assets:delete` permission.
4. A confirmation dialog opens with:
   - Title: **Delete Asset**
   - Content: `Are you sure you want to delete {asset.name}?`
   - The dialog is flagged as `danger: true`.
5. Click the confirm button to proceed.
   - The `deleteAsset.mutateAsync(asset.id)` mutation is called.
   - On success, the user is navigated to `/assets`.
   - On error, the error is handled by the mutation hook.
6. To cancel, click the cancel button in the dialog. No changes are made and the user remains on the detail page.
