# WF-SL-delete-service-location

## Action: Delete a service location

### Prerequisites:
- User must have the permission `service_locations:delete`. If this permission is absent:
  - The "Delete" icon button (tooltip: "Delete") is not rendered in the Actions column of the list page.
  - The **Delete** button is not rendered on the detail page.

### Steps — from the List Page:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. Locate the service location row in the table.
3. In the "Actions" column, click the icon button with tooltip **"Delete"** (`DeleteOutlined` icon, `danger` variant, text size small). This button is visible only when the user holds `service_locations:delete` permission.
4. A confirmation dialog opens with:
   - Title: **Delete Service Location**
   - Content: `Are you sure you want to delete this location at {location.address}?`
   - The dialog is flagged as `danger: true`.
5. Click the confirm button in the dialog to proceed.
   - The `deleteServiceLocation.mutateAsync(location.id)` mutation is called.
   - On success, the list refreshes (TanStack Query invalidation performed by the mutation hook).
   - On error, the error is handled by the mutation hook.
6. To cancel without deleting, click the cancel button in the dialog. No changes are made.

### Steps — from the Detail Page:

1. In the sidebar, click the navigation link that resolves to `nav.serviceLocations` (Service Locations).
2. Navigate to the service location detail page at `/service-locations/{id}`.
3. Click the **Delete** button (`DeleteOutlined` icon, `danger` variant) in the page header actions area. This button is visible only when the user holds `service_locations:delete` permission.
4. A confirmation dialog opens with:
   - Title: **Delete Service Location**
   - Content: `Are you sure you want to delete this location at {location.address}?`
   - The dialog is flagged as `danger: true`.
5. Click the confirm button to proceed.
   - The `deleteServiceLocation.mutateAsync(location.id)` mutation is called.
   - On success, the user is navigated to `/service-locations`.
   - On error, the error is handled by the mutation hook.
6. To cancel, click the cancel button in the dialog. No changes are made and the user remains on the detail page.
