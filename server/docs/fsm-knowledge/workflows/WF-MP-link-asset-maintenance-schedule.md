# WF-MP-link-asset-maintenance-schedule

**Workflow:** Link an asset to a maintenance schedule (view and manage the plan-asset association)
**Module:** Maintenance Plans
**Routes:** `/maintenance-plans` → `/maintenance-plans/{id}` → `/maintenance-plans/{id}/edit`

---

## Prerequisites

- The authenticated user must hold the permission `asset_maintenance_plans:read` to view a
  maintenance plan detail page. The "View" button is wrapped in
  `<PermissionGuard permission="asset_maintenance_plans:read">`.
- To edit the asset-plan link, the user must hold `asset_maintenance_plans:update`.
- To delete a plan, the user must hold `asset_maintenance_plans:delete`.
- At least one asset must exist in the system before a plan can be created or re-linked.

---

## Creating a new plan linked to an asset (primary path)

Follow all steps in **WF-MP-create-maintenance-plan**.
Step 4 of that workflow is where the asset-to-plan link is established:

> In the **Asset** dropdown (label: "Asset"), select the asset to link to this plan.

The selected asset UUID is stored as `asset_id` on the maintenance plan record.

---

## Pre-linking from an asset context (URL parameter path)

When navigating to the create form with the query parameter `?asset_id={uuid}`, the **Asset**
dropdown is pre-populated with the matching asset. This allows asset detail pages or other
asset-centric views to open the form with the asset already selected.

URL pattern: `/maintenance-plans/new?asset_id={asset_uuid}`

No additional user action is required to select the asset; the user may proceed directly to
filling in the **Plan Name** and **Frequency** fields.

---

## Viewing the asset-plan link on a plan detail page

### Steps

1. In the sidebar, click the navigation link that opens the **Maintenance Plans** list page
   (page title: "Maintenance Plans").

2. Locate the maintenance plan in the table. The **Asset** column shows the asset name
   (with a tooltip displaying "Asset ID: {uuid}").
   If the asset name is not resolved, the column shows `Asset #{first 8 chars of asset_id}`.

3. In the **Actions** column, click the icon-only button (tooltip: "View", `EyeOutlined` icon).
   Requires permission `asset_maintenance_plans:read`.
   The application navigates to `/maintenance-plans/{id}`.
   The page title is **Maintenance Plan Details**, subtitle: "Viewing plan: {plan.name}".

4. In the **Plan Information** card (left column), the **Asset** description item shows:
   - The asset name (e.g., `Compressor Unit A`), or
   - `Asset #{first 8 chars of asset_id}` if the name is not available.

5. The **Frequency**, **Next Due Date**, **Last Completed**, **Auto Create Work Order**,
   and **Status** fields are all shown in the same **Plan Information** card.

6. An orange/red **Maintenance Overdue** alert banner is shown at the top of the page
   (above the cards) when `next_due_date` is earlier than today:
   - Message: **Maintenance Overdue**
   - Description: `This maintenance plan is overdue. The next scheduled date was {formatted date}.`
   - Type: `warning`, with an icon.

7. The **Upcoming Schedule** card (right column) shows a Timeline of up to 5 projected
   maintenance dates calculated from `next_due_date` and `frequency`.
   - The first date entry shows the label "Next Due" (green) or "Overdue" (red) below the date.
   - Subsequent dates are shown in grey.
   - If the plan is inactive or has no `next_due_date`, an Empty placeholder is shown:
     - "No schedule set" (when active but no date)
     - "Plan is inactive" (when `is_active` is false)

8. The **Custom Fields** card (right column, below Upcoming Schedule) is shown only when
   `plan.custom_fields` is a non-empty object. Each key-value pair is listed in a Descriptions
   component.

---

## Changing the linked asset (re-linking to a different asset)

### Prerequisites

- User must hold permission `asset_maintenance_plans:update`.

### Steps

1. Navigate to the detail page of the maintenance plan (steps 1–3 above).

2. In the page header, click the **Edit** button (primary, `EditOutlined` icon).
   Requires permission `asset_maintenance_plans:update`.
   The application navigates to `/maintenance-plans/{id}/edit`.
   The page title changes to **Edit Maintenance Plan**,
   subtitle: `Editing "{plan.name}"`.

3. In the **Asset** dropdown (label: "Asset") within the **Plan Details** card, open the
   dropdown and select the new asset.
   The dropdown supports search (`showSearch`).

4. Adjust any other fields as needed:
   - **Plan Name** (label: "Plan Name") — required.
   - **Description** (label: "Description") — optional.
   - **Frequency** (label: "Frequency") — required. Changing frequency auto-fills
     **Next Due Date** if that field is currently empty (same auto-calculate behaviour as create).
   - **Next Due Date** (label: "Next Due Date") — date picker, format `YYYY-MM-DD`.
   - **Last Completed Date** (label: "Last Completed Date") — date picker, format `YYYY-MM-DD`;
     future dates are disabled. This value IS persisted in edit mode.
   - **Auto Create Work Order** switch (label: "Auto Create Work Order") —
     checked children: `Yes`, unchecked children: `No`.
   - **Active** switch (label: "Active") —
     checked children: `Active`, unchecked children: `Inactive`.
     This value IS persisted in edit mode.

5. Click the **Update Plan** button (primary, `SaveOutlined` icon).
   - While the API call is in progress the button shows a loading spinner
     (`updateMaintenancePlan.isPending` state).
   - On success the application navigates back to `/maintenance-plans`.
   - On failure the error is handled by the mutation hook.

6. To abort without saving, click the **Cancel** button (`CloseOutlined` icon).
   The application navigates back to `/maintenance-plans`.

---

## Deleting a maintenance plan (removes the asset-plan link)

### From the list page (requires `asset_maintenance_plans:delete`)

1. On the **Maintenance Plans** list page, locate the row for the plan.
2. In the **Actions** column, click the icon-only button (tooltip: "Delete", `DeleteOutlined` icon,
   rendered with `danger` style).
3. A confirmation dialog appears:
   - Title: **Delete Maintenance Plan**
   - Body: `Are you sure you want to delete the maintenance plan "{plan.name}"?`
   - Confirm is a destructive (`danger: true`) action.
4. Click OK. The plan (and its asset link) is deleted. Clicking Cancel dismisses the dialog.

### From the detail page (requires `asset_maintenance_plans:delete`)

1. Navigate to the plan detail page (`/maintenance-plans/{id}`).
2. In the page header, click the **Delete** button (danger style, `DeleteOutlined` icon).
3. The same confirmation dialog appears (Title: **Delete Maintenance Plan**,
   Body: `Are you sure you want to delete the maintenance plan "{plan.name}"?`).
4. Click OK. On success the application navigates to `/maintenance-plans`.

---

## Back navigation

- On any detail or form page, clicking the **Back to Maintenance Plans** button
  (shown when the plan is not found / "Maintenance plan not found" empty state) or using the
  `onBack` arrow in the page header navigates to `/maintenance-plans`.
