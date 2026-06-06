# WF-PAY-view-payment-detail.md — View Payment Detail

## Overview
This workflow covers all user actions available on the Payment Details page, including navigation, editing, deletion, and linked invoice navigation.

## Prerequisites
- User must have the `payments:read` permission to reach the detail page via the "View" (EyeOutlined icon) action button on the list.
- The **Edit** button in the detail page header is rendered only when the user has the `payments:update` permission.
- The **Delete** button in the detail page header is rendered only when the user has the `payments:delete` permission.
- If the payment record does not exist, an empty state "Payment not found" is shown with a **Back to Payments** button.

---

## Steps — Navigate to Payment Detail

1. In the sidebar, click **nav.payments** (Payments navigation link).
2. The Payments list page loads with the title "Manage payments".
3. Locate the desired payment row in the table.
4. In the **Actions** column, click the icon-only button with tooltip **View** (EyeOutlined icon).
   - This button is wrapped in `PermissionGuard permission="payments:read"`. It is hidden if the user lacks `payments:read`.
5. The browser navigates to `/payments/{id}`.
6. The page title **Payment Details** is displayed, with subtitle `Transaction #{transaction_id or first 8 chars of id}`.
7. If `payment.status === 'failed'`, an alert banner is shown: **Payment Failed** / `{payment.notes or 'This payment transaction failed to process.'}` (type: error).
8. If `payment.status === 'refunded'`, an alert banner is shown: **Payment Refunded** / "This payment has been refunded to the customer." (type: warning).
9. The **Payment Information** card displays the following Descriptions fields:
   - **Transaction ID** — shown as a blue Tag
   - **Amount** — formatted currency
   - **Status** — Tag with icon (CheckCircleOutlined for completed, CloseCircleOutlined for failed, ClockCircleOutlined for all others)
   - **Payment Method** — icon + method text in uppercase
   - **Payment Date** — formatted datetime or "-"
   - **Invoice** — link button "View Invoice" if `invoice_id` is set; otherwise "No invoice linked"
   - **Reference Number** — text or "-"
   - **Notes** — text or "No notes"
   - **Created At** — formatted datetime
   - **Updated At** — formatted datetime
10. If `payment.custom_fields` exists and has keys, an **Additional Information** card renders each custom field as a Descriptions row.
11. The **Payment Timeline** card renders a vertical timeline with events:
    - "Payment Created" (always present, blue, FileTextOutlined icon)
    - "Payment Processing" (present if `status === 'processing'`, orange, ClockCircleOutlined icon)
    - "Payment Completed" (present if `status === 'completed'`, green, CheckCircleOutlined icon)
    - "Payment Failed" (present if `status === 'failed'`, red, CloseCircleOutlined icon)
    - "Payment Refunded" (present if `status === 'refunded'`, purple, DollarOutlined icon)
12. The **Summary** card displays:
    - "Amount Paid:" + formatted currency
    - "Payment Method:" + method text
    - "Status:" + Tag

---

## Actions Available on the Payment Detail Page

### Action A — Navigate Back to List
1. Click the back arrow in the page header (`onBack` handler).
2. Navigates to `/payments`.

### Action B — Edit Payment
Prerequisites: User has `payments:update` permission.

1. On the Payment Details page, click **Edit** (button with EditOutlined icon, in the page header extra area).
2. Navigates to `/payments/{id}/edit`.
3. Follow steps in WF-PAY-edit-payment.md.

### Action C — Delete Payment
Prerequisites: User has `payments:delete` permission.

1. On the Payment Details page, click **Delete** (danger button with DeleteOutlined icon, in the page header extra area).
2. A confirmation dialog appears:
   - Title: **Delete Payment**
   - Content: "Are you sure you want to delete this payment record?"
   - Dialog is in danger mode (destructive confirmation styling).
3. Click **OK** in the confirmation dialog to confirm deletion.
   - `deletePayment.mutateAsync(payment.id)` is called.
   - On success, navigates to `/payments`.
4. Click **Cancel** in the confirmation dialog to abort. The payment is not deleted and the user remains on the Payment Details page.

### Action D — View Linked Invoice
Prerequisites: `payment.invoice_id` must be set (otherwise "No invoice linked" text is shown instead of the button).

1. In the **Payment Information** card, locate the **Invoice** row.
2. Click **View Invoice** (link-style button with no padding).
3. Navigates to `/invoices/{payment.invoice_id}`.

### Action E — "Back to Payments" from Empty State
Prerequisites: Payment record does not exist (API returned no data).

1. The page shows the empty state "Payment not found".
2. Click **Back to Payments**.
3. Navigates to `/payments`.
