# WF-INV-edit-invoice — Edit Invoice

## Overview
Walks a user through editing an existing invoice's header fields from either the list table or the detail page.

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must NOT have a Technician role (TechnicianGuard blocks `/invoices`).
- The **Edit** (tooltip: **"Edit"**) action button in the list table is wrapped in `PermissionGuard permission="invoices:update"` — it renders only when the user has the `invoices:update` permission.
- The **Edit** button on the detail page header is also wrapped in `PermissionGuard permission="invoices:update"`.

## Path A — Edit from Invoice List

1. In the left sidebar under **Financial**, click **Invoices**. The browser navigates to `/invoices`.
2. Locate the target invoice row in the table.
3. In the **Actions** column (fixed right), click the icon-only button with tooltip **"Edit"** (icon: EditOutlined). The browser navigates to `/invoices/{id}/edit`.
4. The `InvoiceFormPage` loads in edit mode. The page header title is **"Edit Invoice"**. While the existing invoice data is fetching, a `Skeleton` active placeholder is shown under the title **"Loading..."**.
5. Once loaded, the form fields are pre-populated via `form.setFieldsValue`:
   - **Customer (Contact)** — pre-selected to the invoice's `contact_id`.
   - **Work Order** — pre-selected to the invoice's `work_order_id`.
   - **Due Date** — pre-set to the invoice's `due_date` (converted to a `dayjs` object).
   - **Currency** — pre-set to the invoice's `currency`.
   - **Notes** — pre-set to the invoice's `notes`.
6. Make the desired changes to any field(s).
7. Click **Update** (primary button, `htmlType="submit"`). The button shows a loading spinner while `updateInvoice.isPending` is true.
8. On success the user is navigated to `/invoices`.
9. To abort, click **Cancel** (secondary button) or click the back-arrow in the page header. Both navigate to `/invoices`.

## Path B — Edit from Invoice Detail Page

1. Navigate to `/invoices/{id}` (see WF-INV-view-invoice.md).
2. In the page header extra area, click **Edit** (button with EditOutlined icon and label **"Edit"**). The browser navigates to `/invoices/{id}/edit`.
3. Continue from step 4 of Path A above.

## Notes
- The `due_date` value is serialised to `YYYY-MM-DD` format before being sent to the server.
- A missing or undefined `due_date` results in the field being omitted from the payload (`undefined`).
- Error handling for failed updates is delegated to the mutation hooks.
