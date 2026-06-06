# WF-EST-line-item-crud — Line Item CRUD in the Estimate Builder

## Prerequisites

- User must be on the **EstimateBuilderPage** (`/estimates/new` or `/estimates/:id/edit`).
- The **Line Items** card is always visible.

---

## Add a Line Item

**Symptoms:**
- "don't have parts"
- "part is missing"
- "just want to charge for labor"
- "how to add custom fee"


1. Click **"Estimates"** in the sidebar.
2. Open a draft estimate (click the eye icon `"View"` then click **"Edit"**, or click
   the `+` icon `"Create Estimate"` from the Drafts tab row) to reach
   `/estimates/:id/edit` or `/estimates/new`.
3. In the **"Line Items"** card, click **"Add Item"** (top-right, `+` icon) OR click
   **"Add First Item"** when the list is empty.
4. The **"Add Line Item"** modal opens (width 680 px). Select the item source using the
   three radio buttons:

   **a. Services Catalog** (`AppstoreOutlined` icon, label `"Services Catalog"`)
   - The **"Choose from Services Catalog"** dropdown appears.
   - Type to search: `"Search services by name or category..."`.
   - Selecting a service auto-fills: **Item Name**, **Description**, **Unit Price**,
     **Tax Rate**, **Unit** (`hrs` if duration is set, else `each`), **Quantity** = 1,
     **Discount** = 0.

   **b. Parts Catalog** (`ToolOutlined` icon, label `"Parts Catalog"`)
   - The **"Choose from Parts Catalog"** dropdown appears.
   - Type to search: `"Search parts by name or SKU..."`.
   - Selecting a part auto-fills: **Item Name**, **Description** (or `"SKU: <sku>"`),
     **Unit Price**, **Tax Rate** = 0, **Unit** = `each`, **Quantity** = 1,
     **Discount** = 0.

   **c. Manual Entry** (`FormOutlined` icon, label `"Manual Entry"`)
   - **Item Type** dropdown is shown (required). Options: `Service`, `Part`, `Labour`,
     `Material`, `Equipment`, `Travel`, `Other`.

5. Complete the common fields (required fields marked):
   - **Item Name** (required) — e.g. `"HVAC Filter Replacement"`.
   - **Unit** — select from: `each`, `hrs`, `days`, `sqft`, `sqm`, `lm`, `kg`, `lot`,
     `visit`, `month`.
   - **Description** — optional free text.
   - **Quantity** (required, min 0.01).
   - **Unit Price** (required, min 0, prefix `$`).
   - **Tax Rate (%)** — numeric, 0–100.
   - **Discount Type** — `"Fixed Amount ($)"` or `"Percentage (%)"`.
   - **Discount ($)** or **Discount (%)** — numeric, min 0.

6. Click **"Add Item"** (modal footer OK button) to commit the item to the local list.
   Click `"Cancel"` (modal footer cancel) to discard without saving.

---

## Edit a Line Item

1. In the **"Line Items"** table, locate the row to edit.
2. Click the **Edit** button (pencil icon `EditOutlined`, tooltip `"Edit"`) in the row's
   action cell.
3. The **"Edit Line Item"** modal opens pre-filled with the item's existing values.
4. Modify any fields as required.
5. Click **"Update Item"** (modal footer OK button) to apply changes.
   Click `"Cancel"` to discard.

---

## Remove a Line Item

1. In the **"Line Items"** table, locate the row to remove.
2. Click the **Remove** button (trash icon `DeleteOutlined`, danger style, tooltip
   `"Remove"`) in the row's action cell.
3. A confirmation dialog appears:
   - **Title**: `"Remove Line Item"`
   - **Content**: `"Remove this item from the estimate?"`
   - **OK button**: `"Remove"` (danger style)
4. Click **"Remove"** to delete the row from the local list, or click `"Cancel"` to
   keep the item.

---

## Reorder Line Items (Drag and Drop)

1. In the **"Line Items"** table, hover over the drag handle column (leftmost column,
   `DragOutlined` icon).
2. Click and hold the drag handle.
3. Drag the row to the desired position.
4. Release. The `sort_order` values are recalculated automatically.

---

## Notes

- Line item changes are **local state only** until the user clicks **"Save Draft"** or
  **"Save & Send for Review"** on the builder page. Only items without an existing `id`
  (i.e., newly added items) are persisted via `createLineItem` API calls on save.
- The **Financial Summary** card (right column) and the totals summary at the bottom
  of the line items table update in real-time as items are added, edited, or removed.
  Displayed rows: **Subtotal**, **Total Discount**, **Tax**, **Grand Total**.
