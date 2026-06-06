# WF-PAY-delete-payment.md — Delete a Payment

## Overview
This workflow covers deleting a payment record. Deletion can be triggered from both the Payment List page and the Payment Detail page.

## Prerequisites
- User must have the `payments:delete` permission. The Delete (DeleteOutlined) icon button on the list and the **Delete** button on the detail page are both wrapped in `PermissionGuard permission="payments:delete"`.

---

## Steps — Delete from Payment List

1. In the sidebar, click **nav.payments** (Payments navigation link).
2. The Payments list page loads with the title "Manage payments".
3. Locate the desired payment row in the table.
4. In the **Actions** column, click the icon-only danger button with tooltip **Delete** (DeleteOutlined icon, rendered in red danger style).
   - This button is wrapped in `PermissionGuard permission="payments:delete"`. It is hidden if the user lacks `payments:delete`.
5. A confirmation dialog appears:
   - Title: **Delete Payment**
   - Content: "Are you sure you want to delete this payment record?"
   - Dialog is in danger mode (destructive confirmation styling).
6. Click **OK** to confirm deletion.
   - `deletePayment.mutateAsync(payment.id)` is called.
   - The payment is removed from the list on success.
7. Click **Cancel** to abort. The payment is not deleted and the user remains on the list.

---

## Steps — Delete from Payment Detail Page

1. Navigate to the Payment Detail page (see WF-PAY-view-payment-detail.md Steps 1-5).
2. In the page header, click **Delete** (danger button with DeleteOutlined icon).
3. A confirmation dialog appears:
   - Title: **Delete Payment**
   - Content: "Are you sure you want to delete this payment record?"
   - Dialog is in danger mode.
4. Click **OK** to confirm deletion.
   - `deletePayment.mutateAsync(payment.id)` is called.
   - On success, navigates to `/payments`.
5. Click **Cancel** to abort. The payment is not deleted and the user remains on the Payment Details page.
