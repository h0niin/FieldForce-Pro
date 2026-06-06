# WF-CAT-add-service-to-catalog

**Workflow:** Add a service to the Services Catalog
**Module:** Services Catalog
**Routes:** `/catalog/services` → `/catalog/services/new`

---

## Prerequisites

- The authenticated user must hold the permission `services-catalog:create`.
  The "Add Service" button is wrapped in `<PermissionGuard permission="services-catalog:create">` and is not rendered without this permission.

---

## Steps

1. In the sidebar, click the navigation link that opens the **Services Catalog** page
   (page title: "Services Catalog", subtitle: "Manage your service offerings").

2. In the page header area, click the **Add Service** button (primary, `PlusOutlined` icon).
   The application navigates to `/catalog/services/new`.
   The page title changes to **Create Service**.

3. In the **Service Name** field (label: "Service Name"), type the name of the service.
   This field is required; leaving it empty and submitting shows the validation message
   "Please enter service name".
   Placeholder text: `e.g. HVAC Installation`.

4. (Optional) In the **Description** field (label: "Description"), type a description.
   Placeholder text: `Describe the service offering`.

5. (Optional) In the **Default Price** field (label: "Default Price"), enter a monetary value.
   The field accepts decimals with 2-decimal precision; minimum value is 0.
   A `$` prefix is shown inside the input. Placeholder: `0.00`.

6. (Optional) In the **Tax Rate (%)** field (label: "Tax Rate (%)"), enter a percentage value.
   Accepts decimals with 2-decimal precision; range is 0–100. Placeholder: `0.00`.

7. (Optional) In the **Duration (minutes)** field (label: "Duration (minutes)"), enter an integer
   number of minutes. Step is 15. Placeholder: `60`.

8. (Optional) In the **Category** dropdown (label: "Category"), select one of the following
   options:
   - `Installation`
   - `Repair`
   - `Maintenance`
   - `Inspection`
   - `Consultation`
   - `Other`
   The dropdown allows clearing the selection (`allowClear`).

9. (Optional) Toggle the **Active** switch (label: "Active").
   The form initialises with this switch enabled (`is_active: true`).

10. Click the **Create** button (primary, `htmlType="submit"`).
    - While the API call is in progress the button shows a loading spinner
      (`createService.isPending` state).
    - On success the application navigates back to `/catalog/services`.
    - On failure the error is handled by the mutation hook (no inline form message is shown).

11. To abort without saving, click the **Cancel** button at any time.
    The application navigates back to `/catalog/services`.

---

## Related Actions on the Services Catalog List Page

### Search services
- Type in the search box (placeholder: "Search services by name or category").
  Results are debounced by 500 ms and the page resets to page 1 on each new search.
  Click the clear icon (`allowClear`) to reset the search.

### View a service (requires `services-catalog:read`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "View", `EyeOutlined` icon).
  The application navigates to `/catalog/services/{id}`.

### Edit a service (requires `services-catalog:update`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "Edit", `EditOutlined` icon).
  The application navigates to `/catalog/services/{id}/edit`.
  The page title changes to **Edit Service** and all fields are pre-populated.
  The submit button label changes to **Update**.

### Delete a service (requires `services-catalog:delete`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "Delete", `DeleteOutlined` icon, rendered with `danger` style).
  A confirmation dialog appears:
  - Title: **Delete Service**
  - Body: `Are you sure you want to delete {service.name}?`
  - Confirm is a destructive (`danger: true`) action.
  - Clicking OK calls the delete mutation; clicking Cancel dismisses the dialog.

### Paginate the list
- The table footer shows the total count ("Total {n} services") and a page-size
  selector (`showSizeChanger: true`). Default page size is 10.
  Changing the page or page size triggers a new API call.

### Sort the list
- Click the **Name** column header to sort alphabetically by name (client-side).
- Click the **Price** column header to sort numerically by `default_price` (client-side).
