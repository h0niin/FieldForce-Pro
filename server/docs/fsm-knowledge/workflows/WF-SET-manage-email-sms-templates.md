# WF-SET-manage-email-sms-templates

## Module
Settings > Email & SMS Templates

## Route
`/settings/email-sms-templates`

## Sidebar Navigation
This route is registered in `routes.tsx` but the sidebar child item (`Email/SMS Templates`) is commented out. Navigate directly to `/settings/email-sms-templates`.

---

## Prerequisites

- User must be authenticated (PrivateRoute).
- No additional permission guard wraps this page in JSX; any authenticated user who can reach the route can view and interact with all controls.

---

## Page Layout

Page header title: **Email & SMS Templates**  
Page header subtitle: "Manage notification templates for automated communications"

A **Create Template** button (primary, PlusOutlined icon) is displayed in the page header.

A `Tabs` component presents two tabs:

| Tab key | Tab label |
|---|---|
| `email` | Email Templates (count badge) |
| `sms` | SMS Templates (count badge) |

Each tab contains a paginated `Table` (10 rows per page).

### Email Templates table columns
`Template Name` | `Event Type` | `Subject` | `Variables` | `Status` | `Updated` | `Actions`

### SMS Templates table columns
`Template Name` | `Event Type` | `Message Preview` | `Length` | `Status` | `Actions`

### Row-level Actions (both tabs)
Each row has three icon-only buttons in the Actions column:

| Icon | Tooltip/aria | onClick handler |
|---|---|---|
| EditOutlined | (no tooltip text) | handleEdit(record) — opens Edit Template modal |
| CopyOutlined | (no tooltip text) | handleEdit(record) — opens Edit Template modal pre-populated (acts as duplicate seed) |
| DeleteOutlined (danger) | (no tooltip text) | handleDelete(record) — opens Delete confirmation dialog |

---

## Steps: Create a New Template

1. Navigate to `/settings/email-sms-templates`.
2. The page title **Email & SMS Templates** is shown.
3. Click the **Create Template** button in the page header (primary, PlusOutlined).
4. The modal **Create Template** opens (width 800 px).
5. Fill in **Template Name** (required; placeholder "e.g., Work Order Assigned Notification").
6. Select **Template Type**:
   - `Email` (MailOutlined icon)
   - `SMS` (MessageOutlined icon)
   - Changing this selection updates which fields are visible (Email Subject appears only for type `Email`; body textarea rows change: 8 for email, 4 for SMS).
7. Select **Trigger Event** from dropdown (required; placeholder "Select when this template should be used"):
   - Work Order Created
   - Work Order Assigned
   - Work Order Completed
   - Appointment Scheduled
   - Appointment Reminder
   - Estimate Sent
   - Estimate Approved
   - Invoice Generated
   - Payment Received
   - Service Request Created
8. If **Template Type** is `Email`: fill in **Email Subject** (required; placeholder "e.g., Your Work Order {{wo_number}} is Ready").
9. Fill in **Email Body** (type=email) or **SMS Message** (type=sms):
   - Email body: textarea 8 rows; placeholder "Enter email content..."
   - SMS message: textarea 4 rows; placeholder "Enter SMS message (max 160 characters recommended)"; max 320 characters; character count shown.
10. Optionally insert template variables by clicking variable buttons in the **Available Variables** card. Each button label is the variable token (e.g., `{{customer_name}}`, `{{wo_number}}`, `{{technician_name}}`, `{{scheduled_date}}`, `{{status}}`). Clicking appends the token to the body field.
11. Toggle **Active** Switch (`checkedChildren="Active"` / `unCheckedChildren="Inactive"`; defaults to Active/checked).
12. Click **OK** (Ant Design Modal footer button) to submit the form, or click **Cancel** to close and discard.
13. On submit: `handleSubmit` is called; modal closes and form is reset.

---

## Steps: Edit an Existing Template

1. Navigate to `/settings/email-sms-templates`.
2. Click the **Email Templates** or **SMS Templates** tab to locate the record.
3. In the target row's Actions column, click the **EditOutlined** (pencil) icon.
4. The modal **Edit Template** opens pre-populated with:
   - Template Name, Template Type, Trigger Event, Subject (if email), Body, Active status.
5. Make the required changes (same fields as Create).
6. Click **OK** to submit, or **Cancel** to discard.

---

## Steps: Duplicate a Template

1. Locate the source template row on the **Email Templates** or **SMS Templates** tab.
2. Click the **CopyOutlined** (copy) icon in the Actions column.
3. The modal **Edit Template** opens pre-populated with the source record's values.
4. Modify any fields as needed (e.g., change Template Name, Trigger Event).
5. Click **OK** to save as a new record (note: the current implementation calls `handleEdit`, which submits an update to the existing record; this behaviour should be verified against API implementation).

---

## Steps: Delete a Template

1. Locate the template row on the **Email Templates** or **SMS Templates** tab.
2. Click the **DeleteOutlined** (trash, danger/red) icon in the Actions column.
3. A confirmation dialog appears:
   - Title: **Delete Template**
   - Body: `Are you sure you want to delete template "{template.name}"?`
4. Click **OK** in the dialog to confirm deletion.
5. Click **Cancel** in the dialog to abort.

---

## Actions Summary

| Action | Trigger | Effect |
|---|---|---|
| Switch between Email / SMS tabs | Click tab | Shows filtered table for that template type |
| Open Create modal | Click "Create Template" | Opens modal titled "Create Template" with empty form |
| Insert variable token | Click variable button in "Available Variables" card | Appends token to body textarea |
| Toggle Active switch | onClick Switch | Updates is_active in form state |
| Submit modal | Click "OK" | Calls handleSubmit; closes modal |
| Cancel modal | Click "Cancel" or modal onCancel | Closes modal; resets form |
| Open Edit modal | Click EditOutlined icon in row | Opens modal titled "Edit Template" pre-populated |
| Open duplicate seed | Click CopyOutlined icon in row | Opens modal titled "Edit Template" pre-populated (same as Edit) |
| Open delete confirmation | Click DeleteOutlined icon in row | showConfirmDialog with title "Delete Template" |
| Confirm deletion | Click "OK" in confirm dialog | Logs delete action (API call stub) |
