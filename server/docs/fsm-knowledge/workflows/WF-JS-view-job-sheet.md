# WF-JS-view-job-sheet — View Job Sheet Instance Detail

## Overview
Opens the read-only detail page for a single job sheet instance, showing its metadata (template, status, work order link, appointment, timestamps, notes) and all checklist items with their values.

## Prerequisites
- User must be authenticated (JWT).
- The job sheet instance must exist.

---

## Steps

1. In the left sidebar, navigate to **Job Sheets**.
   - The page title is **"Job Sheets"** with subtitle **"Manage job sheet instances"**.

2. Select the desired tab:
   - **All Job Sheets** — shows all instances.
   - **Drafts** — shows only the current user's draft instances.
   - **Approvals** — shows instances pending the current user's approval.

3. Optionally type in **"Search job sheets..."** (allowClear, width 400) to filter the table (debounced 500ms).

4. In the **Actions** column of the target row, click the **"View"** tooltip button (EyeOutlined icon, text style, small).
   - Available on every row regardless of status.
   - Navigates to `/job-sheets/<id>`.
   - A full-page Spinner (Spin size="large") shows while the instance loads.

5. The detail page renders with two cards:

   **Card 1 — "Details"** (bordered Descriptions, 2 columns):
   - **Template**: template name (or first 8 chars of `template_id` if name missing, or `N/A`).
   - **Status**: colored Tag — `draft` (default), `pending` (blue), `approved` (cyan), `in_progress` (orange), `completed` (green).
   - **Work Order**: clickable Link to `/work-orders/<work_order_id>` showing first 8 chars of the ID, or `-` if none.
   - **Appointment**: first 8 chars of `appointment_id` or `-` if none.
   - **Created**: formatted date/time.
   - **Updated**: formatted date/time.
   - **Completed** (only shown when `instance.completed_at` is not null): formatted date/time.
   - **Notes** (span=2, only shown when notes exist in `custom_fields.notes`): the notes text.

   **Card 2 — "Items"** (Table, no pagination):
   - **Position**: 1-based sort order (ascending by default).
   - **Type**: Tag with icon — CheckSquareOutlined (checkbox), FileTextOutlined (text), CameraOutlined (photo), EditOutlined (signature), NumberOutlined (number), CalendarOutlined (date).
   - **Label**: item label text.
   - **Value**: item value text or `-` if null.
   - **Required**: `Required` tag (red) or `Optional` tag.

6. The page header shows the current status tag and a **"Back"** button (ArrowLeftOutlined icon).
   - Click **"Back"** to navigate to `/job-sheets`.

7. In the **Work Order** field of the Details card, click the linked work order ID text to navigate to `/work-orders/<work_order_id>`.

---

## Actions Summary

| Action | Trigger | Result |
|--------|---------|--------|
| Click **"All Job Sheets"** tab | Tab onChange | Table shows all instances |
| Click **"Drafts"** tab | Tab onChange | Table shows current user's drafts |
| Click **"Approvals"** tab | Tab onChange | Table shows instances awaiting user approval |
| Search in **"Search job sheets..."** | Input onChange (debounced 500ms) | Table filters by search string |
| Click **"View"** tooltip button | EyeOutlined Tooltip Button | Navigate to `/job-sheets/<id>` |
| Click **"Back"** in page header | ArrowLeftOutlined Button | Navigate to `/job-sheets` |
| Click Work Order link in Details card | React Router Link | Navigate to `/work-orders/<work_order_id>` |
