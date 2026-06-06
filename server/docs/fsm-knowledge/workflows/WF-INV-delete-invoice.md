# WF-INV-delete-invoice — Delete Invoice

## Overview
Walks a user through deleting an invoice via the confirmation dialog, from both the Invoice List page and the Invoice Detail page.

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must NOT have a Technician role (TechnicianGuard blocks `/invoices`).
- The **Delete** action button in the list table is wrapped in `PermissionGuard permission="invoices:delete"` — it is only visible when the user holds the `invoices:delete` permission.
- The **Delete** button on the detail page header is also wrapped in `PermissionGuard permission="invoices:delete"`.

## Path A — Delete from Invoice List

1. In the left sidebar under **Financial**, click **Invoices**. The browser navigates to `/invoices`.
2. Locate the target invoice row in the table.
3. In the **Actions** column (fixed right), click the danger icon-only button with tooltip **"Delete"** (icon: DeleteOutlined, styled with `danger` prop).
4. A confirmation dialog appears with:
   - **Title:** `Delete Invoice`
   - **Content:** `Are you sure you want to delete invoice {invoice_number or id}?`
   - The dialog is opened as a danger dialog (`danger: true`).
5. Click **OK** in the confirmation dialog to confirm deletion. The `deleteInvoice.mutateAsync(invoice.id)` call is executed.
6. On success the list refreshes (TanStack Query invalidation handled by the hook). The deleted row is removed from the table.
7. To cancel deletion, click **Cancel** in the confirmation dialog. No changes are made.

## Path B — Delete from Invoice Detail Page

1. Navigate to `/invoices/{id}` (see WF-INV-view-invoice.md).
2. In the page header extra area, click **Delete** (danger button with DeleteOutlined icon and label **"Delete"**).
3. A confirmation dialog appears with:
   - **Title:** `Delete Invoice`
   - **Content:** `Are you sure you want to delete invoice {invoice_number or id}?`
   - The dialog is opened as a danger dialog (`danger: true`).
4. Click **OK** to confirm. The `deleteInvoice.mutateAsync(invoice.id)` call is executed.
5. On success the user is navigated to `/invoices`.
6. To cancel, click **Cancel** in the dialog. No changes are made.

## Notes
- The confirmation dialog is provided by `showConfirmDialog` from `@/components/common/ConfirmDialog`.
- The guard check `if (!invoice) return;` prevents the handler from running on the detail page if invoice data has not loaded.
- No soft-delete / hard-delete distinction is visible in the UI; the UI calls `deleteInvoice.mutateAsync` and the server-side implementation determines the deletion strategy.
