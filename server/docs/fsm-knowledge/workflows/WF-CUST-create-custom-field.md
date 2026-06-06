# WF-CUST-create-custom-field

## Module
Customization > Custom Fields

## Routes
- List: `/customization/custom-fields`
- Create: `/customization/custom-fields/new` (renders `CustomFieldFormPage` with `isEdit = false`)
- Edit: `/customization/custom-fields/:id/edit` (renders `CustomFieldFormPage` with `isEdit = true`)

## Sidebar Navigation
The "Automation & Customization" section and its "Custom Fields" child item are commented out in `Sidebar.tsx`. Navigate directly to `/customization/custom-fields`.

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- **Create Custom Field** button is wrapped in `PermissionGuard permission="custom-fields:create"`. The button is hidden unless the user holds this permission.
- **View** (EyeOutlined, tooltip "View") action button requires `custom-fields:read`.
- **Edit** (EditOutlined, tooltip "Edit") action button requires `custom-fields:update`.
- **Delete** (DeleteOutlined, tooltip "Delete") action button requires `custom-fields:delete`.
- The **Status** toggle Switch in the list table (Active/Inactive) calls `useUpdateCustomField` and is not wrapped in a PermissionGuard; any authenticated user who can reach the page can toggle it.

---

## Page: Custom Fields List (`/customization/custom-fields`)

Page header title: **Custom Fields**  
Page header subtitle: "Define custom fields for any module"

### Filters available

- **Search** text input (placeholder "Search custom fields...") — debounced 500 ms, resets to page 1.
- **Filter by entity type** Select dropdown (allowClear):
  - Work Order
  - Contact
  - Estimate
  - Invoice
  - Asset

### Table columns
`Label` | `Field Name` | `Entity Type` | `Field Type` | `Required` | `Status` | `Actions`

The **Status** column renders a Switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`) that immediately calls `useUpdateCustomField` on toggle.

---

## Steps: Create a Custom Field

1. Navigate to `/customization/custom-fields`.
2. The page **Custom Fields** loads with the filtered list.
3. Click **Create Custom Field** (primary button, PlusOutlined icon; visible only if user has `custom-fields:create` permission). The browser navigates to `/customization/custom-fields/new`.
4. The page **Create Custom Field** (page header; onBack navigates to `/customization/custom-fields`) loads with an empty form inside a `Card`.
5. Select a **Module** (required; Select dropdown; placeholder "Select module"):
   - Work Orders
   - Service Requests
   - Estimates
   - Invoices
   - Contacts
   - Companies
   - Assets
   - Service Agreements
6. Enter a **Field Name** (required text input; placeholder "e.g. customer_priority"; validation: "Please enter field name"). This is the programmatic identifier.
7. Select a **Field Type** (required Select dropdown; placeholder "Select type"; validation: "Please select field type"):
   - Text
   - Number
   - Email
   - Phone
   - URL
   - Date
   - Date & Time
   - Time
   - Boolean (Yes/No)
   - Select (Dropdown)
   - Multi-Select
   - Text Area
   - Currency
   - Percentage
   - File Upload
8. If **Field Type** is `Select (Dropdown)` or `Multi-Select`, fill in **Options (JSON - for select/multiselect fields)** (TextArea; monospace font; placeholder `["Option 1", "Option 2", "Option 3"]`). The field validates that the value is valid JSON; error: "Invalid JSON format".
9. Toggle **Required** Switch (`checkedChildren="Required"` / `unCheckedChildren="Optional"`; default: Optional/unchecked).
10. Enter a **Sort Order** (InputNumber; min 0; default 0; placeholder "0"). Lower numbers appear first.
11. Click **Create** (primary button; shows loading spinner while `createCustomField.isPending`; label is "Create" when adding new). On success, navigates back to `/customization/custom-fields`.
12. Alternatively, click **Cancel** to discard and navigate to `/customization/custom-fields`.

---

## Steps: Edit a Custom Field

1. Navigate to `/customization/custom-fields`.
2. Locate the target field in the table.
3. Click the **Edit** icon button (EditOutlined, tooltip "Edit"; visible only if user has `custom-fields:update` permission). The browser navigates to `/customization/custom-fields/:id/edit`.
4. While the record loads (only on edit mode), a `Skeleton` is displayed under the page header "Loading...".
5. The form **Edit Custom Field** pre-populates with the existing field's values: Module, Field Name, Field Type, Options (serialised as JSON), Required, Sort Order.
6. Modify any fields.
7. Click **Update** (primary button; loading while `updateCustomField.isPending`; label is "Update" in edit mode). On success, navigates to `/customization/custom-fields`.
8. Alternatively, click **Cancel** to discard and navigate to `/customization/custom-fields`.

---

## Steps: View a Custom Field

1. In the list table, click the **View** icon button (EyeOutlined, tooltip "View"; requires `custom-fields:read` permission). Navigates to `/customization/fields/:id` (detail route).

---

## Steps: Toggle Custom Field Active Status

1. In the **Status** column of any row, click the Switch to toggle between `Active` and `Inactive`.
2. The `useUpdateCustomField` mutation fires immediately with `{ id, is_active: <new value> }`. No confirmation dialog is shown.

---

## Steps: Delete a Custom Field

1. In the list table, click the **Delete** icon button (DeleteOutlined, danger/red, tooltip "Delete"; requires `custom-fields:delete` permission).
2. A confirmation dialog appears:
   - Title: **Delete Custom Field**
   - Body: `Are you sure you want to delete "{field.label}"?`
3. Click **OK** to confirm; `deleteCustomField.mutateAsync(record.id)` is called.
4. Click **Cancel** to abort.

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Search | Text input onChange (debounced) | Filters list by search string; resets to page 1 |
| Filter by entity type | Select onChange | Client-side filters `entity_type` on loaded data; resets page |
| Navigate to Create form | Click "Create Custom Field" | Navigates to `/customization/custom-fields/new` |
| Navigate to Edit form | Click EditOutlined (tooltip "Edit") | Navigates to `/customization/custom-fields/:id/edit` |
| Navigate to View detail | Click EyeOutlined (tooltip "View") | Navigates to `/customization/fields/:id` |
| Toggle Status inline | Click Switch in Status column | Calls useUpdateCustomField with { id, is_active } immediately |
| Open delete confirmation | Click DeleteOutlined (tooltip "Delete") | showConfirmDialog "Delete Custom Field" |
| Confirm deletion | Click "OK" in dialog | deleteCustomField.mutateAsync(id) |
| Submit Create form | Click "Create" | createCustomField.mutateAsync; navigates to list on success |
| Submit Edit form | Click "Update" | updateCustomField.mutateAsync; navigates to list on success |
| Cancel form | Click "Cancel" | Navigates to `/customization/custom-fields` without saving |
| Back from form | Click back arrow (PageHeader onBack) | Navigates to `/customization/custom-fields` |
