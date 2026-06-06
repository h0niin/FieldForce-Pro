# WF-ASSET-edit-asset

## Action: Edit an existing asset

### Prerequisites:
- User must have the permission `assets:update`. If this permission is absent:
  - The "Edit" icon button (tooltip: "Edit") is not rendered in the Actions column of the list page.
  - The "Edit" button is not rendered on the detail page.

### Steps — from the List Page:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Locate the asset row in the table.
3. In the "Actions" column, click the icon button with tooltip **"Edit"** (`EditOutlined` icon, text size small). This button is visible only when the user holds `assets:update` permission.
4. The route navigates to `/assets/{id}/edit`, rendering the "Edit Asset" page header with a back arrow.
5. The form fields are pre-populated from the existing asset record:
   - Asset Name, Manufacturer, Model, Serial Number, Category, Install Date, Warranty Expiry, Health Score (0-100), Customer (Contact), Notes.
   - Install Date and Warranty Expiry are converted to `dayjs` objects for the DatePicker.
6. Modify any fields as needed.
7. To change or clear the linked customer contact, interact with the "Customer (Contact)" searchable Select dropdown.
8. Click **Update** (primary button, `htmlType="submit"`). The button shows a loading spinner while the mutation is pending.
   - On success, the user is navigated to `/assets`.
   - On error, the error is handled by the mutation hook.
9. To abort, click **Cancel**. The user is navigated to `/assets`.

### Steps — from the Detail Page:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Locate the asset row and click the icon button with tooltip **"View"** (`EyeOutlined` icon) in the Actions column (requires `assets:read`), or navigate directly to `/assets/{id}`.
3. On the detail page, click the **Edit** button (`EditOutlined` icon, standard size) in the page header actions area. This button is visible only when the user holds `assets:update` permission.
4. Continue from step 5 of the list-page flow above.
