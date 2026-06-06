# WF-JS-create-template — Create Job Sheet Template

## Overview
Creates a new job sheet template using the drag-and-drop builder. The template defines the checklist structure (items, types, order) that field technicians will fill in when a job sheet instance is created from a work order.

## Prerequisites
- User must have the permission `job-sheets:create` (PermissionGuard wraps the "Add Template" button on the template list page).
- User must be authenticated (JWT).

---

## Steps

1. In the left sidebar, navigate to **Job Sheets** > **Templates**.
   - The page title is **"Job Sheet Templates"** with subtitle **"Manage job sheet templates"**.

2. Click the **"Add Template"** button (top-right, primary style, PlusOutlined icon).
   - Requires `job-sheets:create` permission — button is hidden otherwise.
   - Navigates to `/job-sheets/templates/new`.
   - Page title renders as **"Create Job Sheet Template"** with subtitle **"Build interactive checklists with drag-and-drop"**.

3. In the top card, fill in the template header fields:
   - **Template Name** (required, `name` field): Enter a descriptive name, e.g. `e.g. HVAC Inspection Checklist`.
   - **Category** (`category` field, optional): Select from the dropdown — **Inspection**, **Maintenance**, **Repair**, **Installation**, **Safety**, or **General**.
   - **Status** (`is_active` toggle, default on): Toggle between **Active** (checked) and **Inactive** (unchecked).
   - **Description** (`description` field, optional): Enter a multi-line description in the TextArea — placeholder text is **"Describe this template"**.

4. The lower card has two tabs. The active tab defaults to **"Builder"** (EditOutlined icon tab). The second tab is **"Preview"** (EyeOutlined icon tab).

5. To add a checklist item, locate the **"Add Items"** panel on the right side of the page. The panel shows the note: **"Click an item type to add it to your checklist"**.

6. Click one of the 10 item type buttons to add that item type:
   - **Checkbox** — Yes/No checkbox
   - **Text Input** — Single line text
   - **Text Area** — Multi-line text
   - **Number** — Numeric input
   - **Date** — Date picker
   - **Time** — Time picker
   - **Dropdown** — Select from options
   - **Photo** — Capture photo
   - **Signature** — Digital signature
   - **Rating** — 1-5 star rating

   Clicking any item type button immediately:
   a. Adds a new item with a default label of `New <type> item` to the items list.
   b. Opens the **"Edit `<type>` Item"** modal automatically so you can configure the item.

7. In the **"Edit `<type>` Item"** modal (width 600px):
   - **Label** (required): Enter the field label, placeholder **"e.g. Check filter condition"**.
   - **Description (optional)**: Multi-line TextArea, placeholder **"Add instructions or notes"**.
   - **Required field** checkbox: Check to mark the item as required.
   - If type is **text** or **textarea**: **Placeholder** field appears — enter the placeholder text.
   - If type is **number**: **Minimum Value** and **Maximum Value** fields appear.
   - If type is **dropdown**: **Options (one per line)** TextArea appears (required), placeholder shows 3 example options.
   - Click **"Save"** (okText) to apply changes and close the modal. The item list shows the updated label, Required tag (if set), and type tag.
   - Click **"Cancel"** (or the modal X) to discard changes and close.

8. To reorder items in the Builder tab: drag any item row (grab the MenuOutlined handle icon) and drop it at the desired position. Items reorder live.

9. To edit an existing item in the Builder tab: click the **"Edit"** tooltip button (EditOutlined icon) on the item row. The **"Edit `<type>` Item"** modal opens (step 7).

10. To delete an item in the Builder tab: click the **"Delete"** tooltip button (DeleteOutlined icon, danger style) on the item row. The item is removed immediately and the system shows a success message **"Item deleted"**.

11. To preview the template as technicians will see it: click the **"Preview"** tab (EyeOutlined icon). The preview renders each item with its actual input control (disabled). A note at the bottom reads: **"This is how the job sheet will appear to field technicians."**

12. To return to the Builder tab: click the **"Builder"** tab (EditOutlined icon).

13. When all items are configured, click **"Create Template"** (primary, large, submit button below the tabs).
    - If no items have been added, a warning message fires: **"Please add at least one item to the job sheet"** and submission is halted.
    - On success, the template is saved and the user is navigated back to `/job-sheets/templates`.

14. To discard without saving, click **"Cancel"** (large button beside "Create Template") or the back chevron in the page header. Both navigate to `/job-sheets/templates`.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"Add Template"** | PermissionGuard(`job-sheets:create`) button on list page | Navigate to `/job-sheets/templates/new` |
| Click item type button in "Add Items" panel | onClick | Item added + Edit modal opens |
| Click **"Save"** in Edit modal | Modal okText button | Item label/config saved, modal closed |
| Click **"Cancel"** in Edit modal | Modal cancel / X | Changes discarded, modal closed |
| Click **"Edit"** tooltip on item row | Tooltip(`"Edit"`) button | Edit modal opens for that item |
| Click **"Delete"** tooltip on item row | Tooltip(`"Delete"`) danger button | Item removed; message **"Item deleted"** |
| Drag item row | draggable div onDragOver | Item reorders in list |
| Click **"Preview"** tab | Tab onChange | Preview tab renders all items |
| Click **"Builder"** tab | Tab onChange | Builder tab active |
| Click **"Create Template"** | htmlType="submit" | Validates, saves template, navigate to `/job-sheets/templates` |
| Click **"Cancel"** | onClick | Navigate to `/job-sheets/templates` |
