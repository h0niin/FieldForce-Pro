# WF-JS-delete-template — Delete Job Sheet Template

## Overview
Soft-deletes a job sheet template after confirmation via a dialog. The "Delete" button is permission-gated.

## Prerequisites
- User must have the permission `job-sheets:delete` (PermissionGuard wraps the "Delete" tooltip button in the Actions column).
- A template record must already exist.

---

## Steps

1. In the left sidebar, navigate to **Job Sheets** > **Templates**.
   - The page title is **"Job Sheet Templates"** with subtitle **"Manage job sheet templates"**.

2. Locate the template to delete. Use the **"Search templates by name..."** search field if needed.

3. In the **Actions** column of the target template row, click the **"Delete"** tooltip button (DeleteOutlined icon, danger style, text type, small size).
   - This button is visible only when the user has `job-sheets:delete` permission.
   - A confirmation dialog opens with:
     - **Title**: `Delete Job Sheet Template`
     - **Content**: `Are you sure you want to delete template "<template name>"?`
     - Two buttons: **OK** (danger style) and **Cancel**.

4. Click **OK** to confirm deletion.
   - The `deleteTemplate.mutateAsync(template.id)` mutation fires.
   - The template is removed from the list (soft-deleted on the server).

5. Click **Cancel** (or close the dialog) to abort — no changes are made.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"Delete"** tooltip button in list row | PermissionGuard(`job-sheets:delete`) Tooltip danger button | Confirmation dialog opens |
| Click **OK** in confirmation dialog | onOk handler | Template deleted; list refreshes |
| Click **Cancel** in confirmation dialog | onCancel handler | Dialog closed; no changes |
