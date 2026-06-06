# WF-JS-edit-template — Edit Job Sheet Template

## Overview
Edits an existing job sheet template — updating its name, category, status, description, and checklist items — using the same drag-and-drop builder as template creation.

## Prerequisites
- User must have the permission `job-sheets:update` (PermissionGuard wraps the "Edit" tooltip button in the template list Actions column).
- User must be authenticated (JWT).
- A template record must already exist.

---

## Steps

1. In the left sidebar, navigate to **Job Sheets** > **Templates**.
   - The page title is **"Job Sheet Templates"** with subtitle **"Manage job sheet templates"**.

2. Optionally use the **"Search templates by name..."** search field (allowClear, width 400) to locate the template. Results are debounced (500ms) and the table paginates.

3. In the **Actions** column of the target template row, click the **"Edit"** tooltip button (EditOutlined icon, text style, small).
   - This button is visible only when the user has `job-sheets:update` permission.
   - Navigates to `/job-sheets/templates/<id>/edit`.
   - The page shows a Skeleton while the template data loads.
   - Once loaded, the page title renders as **"Edit Job Sheet Template"** with subtitle **"Build interactive checklists with drag-and-drop"**.
   - All existing field values are pre-filled: name, description, category, is_active toggle, and items (parsed from `template.metadata.items`).

4. Modify any header field in the top card:
   - **Template Name** (required): update the name.
   - **Category**: change or clear the category dropdown.
   - **Status**: toggle the **Active** / **Inactive** switch.
   - **Description**: update the TextArea.

5. Modify items using the **"Builder"** tab (active by default):
   - **Add item**: click a type button in the **"Add Items"** panel on the right; Edit modal opens automatically (see WF-JS-create-template step 7 for modal fields).
   - **Edit item**: click the **"Edit"** tooltip button (EditOutlined) on the item row; Edit modal opens pre-filled.
   - **Delete item**: click the **"Delete"** tooltip button (DeleteOutlined, danger) on the item row; item is removed and message **"Item deleted"** shows.
   - **Reorder items**: drag item rows using the MenuOutlined handle.

6. To verify the appearance, click the **"Preview"** tab (EyeOutlined icon).

7. When done, click **"Update Template"** (primary, large, submit button below the tabs).
   - If no items remain after edits, a warning fires: **"Please add at least one item to the job sheet"** and submission is halted.
   - On success, the template is updated and the user is navigated back to `/job-sheets/templates`.

8. To discard without saving, click **"Cancel"** (large button beside "Update Template") or the back chevron in the page header. Both navigate to `/job-sheets/templates`.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"Edit"** tooltip button in list row | PermissionGuard(`job-sheets:update`) Tooltip button | Navigate to `/job-sheets/templates/<id>/edit` |
| Click item type button in "Add Items" panel | onClick | Item added + Edit modal opens |
| Click **"Edit"** tooltip on item row | Tooltip(`"Edit"`) button | Edit modal opens pre-filled |
| Click **"Delete"** tooltip on item row | Tooltip(`"Delete"`) danger button | Item removed; message **"Item deleted"** |
| Drag item row | draggable div onDragOver | Item reorders |
| Click **"Update Template"** | htmlType="submit" | Validates, updates template, navigate to `/job-sheets/templates` |
| Click **"Cancel"** | onClick | Navigate to `/job-sheets/templates` |
