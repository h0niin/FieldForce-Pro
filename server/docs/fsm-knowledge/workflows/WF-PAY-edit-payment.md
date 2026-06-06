# WF-PAY-edit-payment.md — Edit an Existing Payment

## Overview
This workflow covers updating an existing payment record. The form is the same component as Record Payment (PaymentFormPage) rendered in edit mode (`isEdit = true`).

## Prerequisites
- User must have the `payments:update` permission. The Edit (EditOutlined) icon button on the list and the **Edit** button on the detail page are both wrapped in `PermissionGuard permission="payments:update"`.
- The payment record must exist and be retrievable by `id`. While loading, the page shows the title "Loading..." with a skeleton card.

---

## Steps — Via Payment List

1. In the sidebar, click **nav.payments** (Payments navigation link).
2. The Payments list page loads with the title "Manage payments".
3. Locate the desired payment row in the table.
4. In the **Actions** column, click the icon-only button with tooltip **Edit** (EditOutlined icon).
   - This button is wrapped in `PermissionGuard permission="payments:update"`. It is hidden if the user lacks `payments:update`.
5. The browser navigates to `/payments/{id}/edit`.

## Steps — Via Payment Detail Page

1. Navigate to the Payment Detail page (see WF-PAY-view-payment-detail.md Steps 1-5).
2. In the page header, click **Edit** (button with EditOutlined icon).
3. The browser navigates to `/payments/{id}/edit`.

---

## Steps — Complete the Edit Form

4. The page title **Edit Payment** is shown.
5. The form pre-populates with existing values:
   - **Invoice** — pre-selected invoice from `payment.invoice_id`
   - **Amount** — pre-filled from `payment.amount`
   - **Payment Method** — pre-selected from `payment.method`
   - **Transaction ID** — pre-filled from `payment.gateway_transaction_id`
   - **Paid At** — pre-filled as a dayjs date from `payment.paid_at`
   - **Notes** — pre-filled from `payment.notes`
6. Modify any of the following fields as needed:
   - **Invoice** (required) — searchable select; options formatted as `{invoice_number} - {first_name} {last_name} (Total: {total})`
   - **Amount** (required) — numeric, min 0, step 0.01, precision 2
   - **Payment Method** — select one of: `Card`, `Cash`, `Bank Transfer`, `Online`, `Check`, `Other`
   - **Transaction ID** — free text (placeholder: `e.g. txn_1234567890`)
   - **Paid At** — date-time picker
   - **Notes** — textarea (placeholder: `Additional notes for this payment`)
7. Click **Update** (primary button, `htmlType="submit"`).
   - While the mutation is pending the button shows a loading spinner.
   - `paid_at` is converted to ISO string before submission.
   - On success, navigates to `/payments`.
   - On error, the error is handled by the mutation hook.
8. To abandon without saving, click **Cancel** — navigates to `/payments`.

---

## Validation Rules (client-side)
| Field | Rule |
|-------|------|
| Invoice | Required — "Please select an invoice" |
| Amount | Required — "Please enter the payment amount" |
| Payment Method | Not required |
| Transaction ID | Optional |
| Paid At | Optional |
| Notes | Optional |
