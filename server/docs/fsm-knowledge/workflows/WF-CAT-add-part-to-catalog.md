# WF-CAT-add-part-to-catalog

**Workflow:** Add a part/material to the Parts Catalog
**Module:** Parts Catalog
**Routes:** `/catalog/parts` → `/catalog/parts/new`

---

## Prerequisites

- The authenticated user must hold the permission `parts-catalog:create`.
  The "Add Part" button is wrapped in `<PermissionGuard permission="parts-catalog:create">` and is
  not rendered without this permission.

---

## Steps

1. In the sidebar, click the navigation link that opens the **Parts Catalog** page
   (page title: "Parts Catalog", subtitle: "Manage your parts inventory").

2. In the page header area, click the **Add Part** button (primary, `PlusOutlined` icon).
   The application navigates to `/catalog/parts/new`.
   The page title changes to **Create Part**.

3. In the **Part Name** field (label: "Part Name"), type the name of the part.
   This field is required; leaving it empty and submitting shows the validation message
   "Please enter part name".
   Placeholder text: `e.g. Compressor Motor`.

4. (Optional) In the **SKU** field (label: "SKU"), enter the stock-keeping unit identifier.
   Placeholder: `e.g. COMP-MOT-001`.

5. (Optional) In the **Category** dropdown (label: "Category"), select one of the following
   options:
   - `Electrical`
   - `Mechanical`
   - `Plumbing`
   - `HVAC`
   - `Filters`
   - `Hardware`
   - `Safety`
   - `Other`
   The dropdown allows clearing the selection (`allowClear`).

6. (Optional) In the **Description** field (label: "Description"), type a description of the part.
   Placeholder: `Describe the part`.

7. (Optional) In the **Unit Price** field (label: "Unit Price"), enter the per-unit monetary value.
   Accepts decimals with 2-decimal precision; minimum value is 0.
   A `$` prefix is shown inside the input. Placeholder: `0.00`.

8. (Optional) In the **Supplier** field (label: "Supplier"), enter the supplier name.
   Placeholder: `e.g. ACME Parts Co.`.

9. In the **Stock Quantity** field (label: "Stock Quantity"), enter the current quantity on hand.
   Accepts integers ≥ 0; step is 1. Placeholder: `0`.
   The form initialises this field to `0`.

   Note: A "Low Stock" red badge is shown in the list view whenever
   `stock_qty <= reorder_level`.

10. In the **Reorder Level** field (label: "Reorder Level"), enter the quantity threshold that
    triggers the "Low Stock" indicator.
    Accepts integers ≥ 0; step is 1. Placeholder: `0`.
    The form initialises this field to `0`.

11. (Optional) Toggle the **Active** switch (label: "Active").
    The form initialises with this switch enabled (`is_active: true`).

12. Click the **Create** button (primary, `htmlType="submit"`).
    - While the API call is in progress the button shows a loading spinner
      (`createPart.isPending` state).
    - On success the application navigates back to `/catalog/parts`.
    - On failure the error is handled by the mutation hook.

13. To abort without saving, click the **Cancel** button at any time.
    The application navigates back to `/catalog/parts`.

---

## Related Actions on the Parts Catalog List Page

### Search parts
- Type in the search box (placeholder: "Search parts by name, SKU, or category").
  Results are debounced by 500 ms and the page resets to page 1 on each new search.
  Click the clear icon (`allowClear`) to reset the search.

### Identify low-stock parts
- The **Stock Qty** column renders a red **Low Stock** tag next to the quantity when
  `stock_qty <= reorder_level`. No user action is required; this is a read-only indicator.

### View a part (requires `parts-catalog:read`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "View", `EyeOutlined` icon).
  The application navigates to `/catalog/parts/{id}`.

### Edit a part (requires `parts-catalog:update`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "Edit", `EditOutlined` icon).
  The application navigates to `/catalog/parts/{id}/edit`.
  The page title changes to **Edit Part** and all fields are pre-populated.
  The submit button label changes to **Update**.

### Delete a part (requires `parts-catalog:delete`)
- In the **Actions** column of the table row, click the icon-only button
  (tooltip: "Delete", `DeleteOutlined` icon, rendered with `danger` style).
  A confirmation dialog appears:
  - Title: **Delete Part**
  - Body: `Are you sure you want to delete {part.name}?`
  - Confirm is a destructive (`danger: true`) action.
  - Clicking OK calls the delete mutation; clicking Cancel dismisses the dialog.

### Paginate the list
- The table footer shows the total count ("Total {n} parts") and a page-size selector
  (`showSizeChanger: true`). Default page size is 10.
  Changing the page or page size triggers a new API call.

### Sort the list
- Click the **Name** column header to sort alphabetically by name (client-side).
- Click the **Price** column header to sort numerically by `unit_price` (client-side).
- Click the **Stock Qty** column header to sort numerically by `stock_qty` (client-side).
