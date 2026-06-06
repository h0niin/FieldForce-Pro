# WF-JS-view-template — View Job Sheet Template Detail

## Overview
Opens the read-only detail view of an existing job sheet template.

## Prerequisites
- User must have the permission `job-sheets:read` (PermissionGuard wraps the "View" tooltip button in the Actions column).

---

## Steps

1. In the left sidebar, navigate to **Job Sheets** > **Templates**.
   - The page title is **"Job Sheet Templates"** with subtitle **"Manage job sheet templates"**.

2. Locate the template to view. Use the **"Search templates by name..."** search field if needed (debounced 500ms, allowClear).

3. In the **Actions** column of the target row, click the **"View"** tooltip button (EyeOutlined icon, text style, small size).
   - This button is visible only when the user has `job-sheets:read` permission.
   - Navigates to `/job-sheets/templates/<id>`.

4. The template detail page renders with all template metadata.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"View"** tooltip button in list row | PermissionGuard(`job-sheets:read`) Tooltip button | Navigate to `/job-sheets/templates/<id>` |
