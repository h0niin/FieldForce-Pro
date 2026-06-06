# WF-JS-complete-job-sheet — Complete a Job Sheet (Build / Fill Out)

## Overview
A user edits a job sheet instance that is in `draft` status: they can add/reorder/delete items, add notes, and then either save as draft again or submit the sheet for review (changing status to `pending`).

## Prerequisites
- A job sheet instance must already exist with status `draft`. (Instances are created from work orders or appointments by the server, not from this UI.)
- The "Complete Draft" action button (PlusOutlined icon, tooltip **"Complete Draft"**) is only rendered in the Actions column when `record.status === 'draft'`.
- User must be authenticated (JWT).

---

## Steps

1. In the left sidebar, navigate to **Job Sheets**.
   - The page title is **"Job Sheets"** with subtitle **"Manage job sheet instances"**.
   - Three tabs are displayed: **All Job Sheets**, **Drafts**, **Approvals**.

2. To find draft job sheets quickly, click the **"Drafts"** tab.
   - The table reloads showing only the current user's draft instances.

3. Optionally type in the **"Search job sheets..."** search field (allowClear, width 400) to narrow results (debounced 500ms).

4. In the **Actions** column of a draft row, click the **"Complete Draft"** tooltip button (PlusOutlined icon, text style, small, blue color `#1677ff`).
   - This button is only rendered when `record.status === 'draft'`.
   - Navigates to `/job-sheets/<id>/edit`.
   - The page title is **"Complete Job Sheet"** with subtitle showing **"Template: <template name>"**.

5. The **"Details"** card shows two fields:
   - **Work Order** (read-only, disabled Input): displays the linked work order number and summary, or **"No work order linked"** if none is linked. This field cannot be edited.
   - **Notes (optional)** (`notes` FormItem): a TextArea with 3 rows, placeholder **"Add any notes..."**. Enter or update any field notes.

6. The **"Items"** card shows the current checklist items table with columns: **Position**, **Type**, **Label**, **Required**, and an action column.

7. To reorder items, click the up-arrow button (ArrowUpOutlined, disabled when at position 1) or down-arrow button (ArrowDownOutlined, disabled when at last position) in the **Position** column. Each click swaps the item with its neighbor.

8. To add a new item to this instance, click **"Add Item"** (primary, small, PlusOutlined icon) in the **"Items"** card header.
   - The **"Add Item"** modal opens (title: **"Add Item"**).
   - Fill in the modal form:
     - **Label** (required): text input, placeholder **"e.g. Equipment Serial Number"**.
     - **Type** (required): select from **Checkbox**, **Text**, **Number**, **Photo**, **Signature**, **Date** (default: **text**).
     - **Required** toggle (Switch, default off).
   - Click **"Add"** (primary, htmlType="submit") to save the item. The modal closes and the item appears in the table.
   - Click **"Cancel"** (or the modal X) to close without adding.

9. To delete an item, click the DeleteOutlined icon button (danger, text style, small) in the action column of the item row. The item is removed immediately.

10. Once all changes are made, choose one of two save actions at the bottom card:
    - **"Save Draft"** (SaveOutlined icon): sets `status` to `'draft'` and submits the form. The instance remains in draft status. On success, navigates to `/job-sheets`.
    - **"Submit for Review"** (primary): sets `status` to `'pending'` and submits the form. The instance moves to `pending` status (awaiting approval). On success, navigates to `/job-sheets`.

11. To discard changes and return to the list, click **"Cancel"** (text button, bottom left of the action card). Navigates to `/job-sheets`.

12. To navigate back without submitting, click the **"Back"** button (ArrowLeftOutlined icon) in the page header. Navigates to `/job-sheets`.

---

## What Happens on Submit

- `updateInstance.mutateAsync` is called with the updated `status` and `custom_fields.notes`.
- Any items whose `sort_order` changed are updated individually via `jobSheetItemsApi.update`.
- After all position updates, the `['job-sheet-items']` TanStack Query cache is invalidated.
- The user is redirected to `/job-sheets`.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"Drafts"** tab | Tab onChange | Table shows only current user's draft instances |
| Click **"All Job Sheets"** tab | Tab onChange | Table shows all instances |
| Search in **"Search job sheets..."** | Input onChange (debounced 500ms) | Table filters by search string |
| Click **"Complete Draft"** tooltip button | `record.status === 'draft'` Tooltip(PlusOutlined) | Navigate to `/job-sheets/<id>/edit` |
| Click up-arrow in Position column | ArrowUpOutlined Button | Item swaps with item above |
| Click down-arrow in Position column | ArrowDownOutlined Button | Item swaps with item below |
| Click **"Add Item"** in Items card header | Primary Button (PlusOutlined) | "Add Item" modal opens |
| Click **"Add"** in "Add Item" modal | htmlType="submit" Button | Item created, modal closes |
| Click **"Cancel"** in "Add Item" modal | Button / modal X | Modal closed, no item added |
| Click DeleteOutlined button on item row | Danger text Button | Item deleted from instance |
| Click **"Save Draft"** | onClick sets status=`draft`, form.submit() | Instance saved as draft; navigate to `/job-sheets` |
| Click **"Submit for Review"** | onClick sets status=`pending`, form.submit() | Instance submitted for approval; navigate to `/job-sheets` |
| Click **"Cancel"** in action card | onClick | Navigate to `/job-sheets` |
| Click **"Back"** in page header | ArrowLeftOutlined Button | Navigate to `/job-sheets` |
