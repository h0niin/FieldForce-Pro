# WF-ASSET-add-maintenance-plan

## Action: Add a maintenance plan to an asset

### Prerequisites:
- User must have the permission `assets:create`. If this permission is absent, the "Add Plan" button on the asset detail page is not rendered.
- The asset must exist and be viewable at `/assets/{id}`.

### Steps:

1. In the sidebar, click the navigation link that resolves to `nav.assets` (Assets).
2. Navigate to the asset detail page by clicking the "View" icon button (tooltip: "View", requires `assets:read`) in the Actions column, navigating to `/assets/{id}`.
3. Scroll down to the **"Maintenance Plans"** card.
4. Click **Add Plan** (`PlusOutlined` icon, `type="primary"`, `size="small"`). This button is visible only when the user holds `assets:create` permission.
5. The route navigates to `/maintenance-plans/new?asset_id={asset.id}`.
6. Complete the maintenance plan form at that route and save.
7. On return to the asset detail page the "Maintenance Plans" table refreshes to show the newly created plan with columns: Plan Name, Frequency (Tag), Next Due, Auto WO (Yes/No tag), Active (Active green / Inactive red tag).
