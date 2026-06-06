# WF-MP-create-maintenance-plan

**Workflow:** Create a new maintenance plan
**Module:** Maintenance Plans
**Routes:** `/maintenance-plans` → `/maintenance-plans/new`

---

## Prerequisites

- The authenticated user must hold the permission `asset_maintenance_plans:create`.
  The "Add Maintenance Plan" button is wrapped in
  `<PermissionGuard permission="asset_maintenance_plans:create">` and is not rendered without this
  permission.
- At least one asset must exist in the system; the Asset dropdown is populated from
  `/assets?take=100`. If no assets exist, the dropdown is empty and the form cannot be submitted.

---

## Steps

1. In the sidebar, click the navigation link that opens the **Maintenance Plans** page
   (page title: "Maintenance Plans", subtitle: "Manage asset maintenance plans and schedules").

2. In the page header area, click the **Add Maintenance Plan** button (primary, `PlusOutlined` icon).
   The application navigates to `/maintenance-plans/new`.
   The page title changes to **Add Maintenance Plan**,
   subtitle: "Create a new maintenance plan".

3. The form is divided into two cards: **Plan Details** (left, 16-column width) and
   **Schedule Settings** (right, 8-column width).

   ### Plan Details card

4. In the **Asset** dropdown (label: "Asset"), select the asset to link to this plan.
   The dropdown supports search (`showSearch`, `optionFilterProp="children"`).
   Each option displays the asset name followed by the serial number in parentheses
   if a serial number exists, e.g. `Compressor Unit A (SN-12345)`.
   Placeholder: `Select an asset`.
   This field is required; leaving it empty shows the validation message
   "Asset is required".

   Note: The URL query parameter `asset_id` pre-selects an asset in this dropdown.
   When navigating from an asset detail page with `?asset_id={id}`, the asset is
   pre-filled automatically.

5. In the **Plan Name** field (label: "Plan Name"), type a name for the maintenance plan.
   Placeholder: `e.g., Monthly HVAC Inspection`.
   This field is required; leaving it empty shows "Plan name is required".

6. (Optional) In the **Description** field (label: "Description"), enter a description of the
   maintenance activities to be performed.
   Placeholder: `Describe what maintenance activities should be performed...`.

7. In the **Frequency** dropdown (label: "Frequency"), select one of the following options:
   - `Daily`
   - `Weekly`
   - `Monthly`  ← default initial value
   - `Quarterly`
   - `Yearly`
   This field is required; leaving it empty shows "Frequency is required".

   Side effect: When a frequency is selected and the **Next Due Date** field is currently
   empty, the system automatically calculates and pre-fills the next due date as follows:
   - Daily → today + 1 day
   - Weekly → today + 1 week
   - Monthly → today + 1 month
   - Quarterly → today + 3 months
   - Yearly → today + 1 year

   ### Schedule Settings card

8. (Optional) In the **Next Due Date** date picker (label: "Next Due Date"), select the date on
   which the maintenance is first due.
   Format: `YYYY-MM-DD`. Placeholder: `Select next due date`.
   If left blank the plan is saved without a scheduled date; the list shows "Not scheduled".

   Note on create: the `last_completed_date` field is sent to the API only in Edit mode.
   On create, the field is present in the UI but the value is discarded before the API call.

9. (Optional) In the **Last Completed Date** date picker (label: "Last Completed Date"), select
   the most recent date the maintenance was completed.
   Format: `YYYY-MM-DD`. Placeholder: `Select last completed date`.
   Future dates are disabled (`disabledDate` blocks any date after today).

   Note: This value is omitted from the create payload even if filled in here. It is only
   persisted when editing an existing plan.

10. Toggle the **Auto Create Work Order** switch (label: "Auto Create Work Order").
    - Checked label: `Yes`; unchecked label: `No`.
    - Initialises to `Yes` (enabled).
    When enabled, the system will automatically create a work order when the plan becomes due.
    The Schedule Preview area (read-only text below the switch) reflects this with:
    "Work orders will be created automatically".

11. Toggle the **Active** switch (label: "Active").
    - Checked label: `Active`; unchecked label: `Inactive`.
    - Initialises to `Active` (enabled).

    Note: On create, this value is also omitted from the API payload. It is only persisted
    during edit.

12. Review the **Schedule Preview** panel (read-only, background `#f5f5f5`) in the Schedule
    Settings card. It displays a live summary of frequency, next due date, and whether work
    orders will be auto-created.

13. Click the **Create Plan** button (primary, `SaveOutlined` icon, `htmlType="submit"`).
    - While the API call is in progress the button shows a loading spinner
      (`createMaintenancePlan.isPending` state).
    - On success the application navigates back to `/maintenance-plans`.
    - On failure the error is handled by the mutation hook.

14. To abort without saving, click the **Cancel** button (`CloseOutlined` icon) at any time.
    The application navigates back to `/maintenance-plans`.

---

## Related Actions on the Maintenance Plans List Page

### Search maintenance plans
- Type in the search box (placeholder: "Search maintenance plans by name or description").
  Results are debounced by 500 ms and the page resets to page 1 on each new search.
  Click the clear icon (`allowClear`) to reset the search.

### Identify overdue plans
- The **Next Due Date** column renders:
  - A red `CalendarOutlined` icon and red date text when the plan is overdue.
  - An **Overdue** badge (`status="error"`) next to the date when overdue.
  - A green `CalendarOutlined` icon when the date is in the future.
  - The text "Not scheduled" (grey) when no date is set.

### View a maintenance plan (requires `asset_maintenance_plans:read`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "View", `EyeOutlined` icon).
  The application navigates to `/maintenance-plans/{id}`.

### Edit a maintenance plan (requires `asset_maintenance_plans:update`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "Edit", `EditOutlined` icon).
  The application navigates to `/maintenance-plans/{id}/edit`.
  The page title changes to **Edit Maintenance Plan** and all fields are pre-populated.
  The submit button label changes to **Update Plan**.
  In edit mode the **Last Completed Date** and **Active** switch values are included
  in the API payload.

### Delete a maintenance plan from the list (requires `asset_maintenance_plans:delete`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "Delete", `DeleteOutlined` icon, rendered with `danger` style).
  A confirmation dialog appears:
  - Title: **Delete Maintenance Plan**
  - Body: `Are you sure you want to delete the maintenance plan "{plan.name}"?`
  - Confirm is a destructive (`danger: true`) action.
  - Clicking OK calls the delete mutation; clicking Cancel dismisses the dialog.

### Paginate the list
- The table footer shows the total count ("Total {n} maintenance plans") and a page-size
  selector (`showSizeChanger: true`). Default page size is 10.

### Sort by Next Due Date
- Click the **Next Due Date** column header to sort chronologically (client-side).
  Plans without a due date sort to the bottom.
