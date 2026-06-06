# WF-ASSET-view-asset

## Action: View asset details

### Prerequisites:
- User must have the permission `assets:read`. If this permission is absent the "View" icon button (tooltip: "View") is not rendered in the Actions column.

### Steps:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. The list page loads. The page header shows title `nav.assets` and subtitle "Manage customer assets and equipment".
3. The table displays columns: Asset Name, Serial Number, Manufacturer, Category, Health, Warranty, Customer, Created, Actions.
   - **Health** column renders a colored tag: green (>=80%), orange (>=50%), red (<50%), or dash if null.
   - **Warranty** column renders a tag: "Active" (green), "Expiring Soon" (orange), "Expired" (red), or "N/A" (default) based on `warranty_expiry` date.
   - **Customer** column shows `{first_name} {last_name}` from the linked contact, or dash.
4. Use the search bar ("Search assets by name, serial number, manufacturer, or category") to filter records. Input is debounced 500ms before triggering a server-side search. The search bar has `allowClear`.
5. Use the pagination controls at the bottom. The total count is shown as "Total {n} assets". Page size can be changed via "showSizeChanger".
6. In the "Actions" column, click the icon button with tooltip **"View"** (`EyeOutlined` icon). The button is visible only when the user holds `assets:read` permission.
7. The route navigates to `/assets/{id}`, rendering the detail page.
8. The detail page displays:
   - Page header with the asset name as title, and a back arrow (navigates to `/assets`).
   - Header actions: "Edit" button (`assets:update` permission) and "Delete" button (`assets:delete` permission).
   - **"Asset Information"** card (`<Descriptions column={2} bordered>`):
     - Asset Name (span 2), Model, Serial Number, Manufacturer, Category (Tag), Install Date, Warranty Expiry (with Active/Expired tag), Health Score (colored Tag), Customer (first + last name), Location (address, span 2), Notes (span 2), Created At, Updated At.
   - **"Maintenance Plans"** card:
     - Table with columns: Plan Name, Frequency (Tag), Next Due, Auto WO (Yes/No tag), Active (Active green / Inactive red tag).
     - Empty text: "No maintenance plans configured".
     - Header extra: **"Add Plan"** button (`PlusOutlined` icon, primary, small size) — visible when user holds `assets:create` permission. Clicking navigates to `/maintenance-plans/new?asset_id={asset.id}`.
   - **"Custom Fields"** card — rendered only when `asset.custom_fields` is non-null and has at least one key. Shows key-value pairs in a `<Descriptions column={2} bordered>`.
