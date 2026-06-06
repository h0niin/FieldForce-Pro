# WF-PAY-record-payment.md — Record a Payment

## Overview
This workflow covers creating a new payment record against an existing invoice from the Payments module.

## Prerequisites
- User must have the `payments:create` permission. The "Record Payment" form page is only accessible when navigating to `/payments/new`; there is no "New Payment" button on the list page guarded by a PermissionGuard (the list page has no create button — the form is reached via direct navigation or from another module). No status check on the invoice is enforced client-side.

---

## Steps

1. In the sidebar, click **nav.payments** (Payments navigation link).
2. The page title "Manage payments" with the payments table is displayed.
3. Navigate to `/payments/new` directly (no create button exists on the list page).
4. The page title changes to **Record Payment**.
5. In the **Invoice** field (required), click the dropdown — a searchable select appears showing options in the format `{invoice_number} - {first_name} {last_name} (Total: {total})`. Type to filter by invoice number or customer name. Select the desired invoice.
6. In the **Amount** field (required), enter a numeric value. The field accepts decimals with a step of `0.01` and a minimum of `0`. The value must be a number greater than or equal to 0.
7. In the **Payment Method** field, select one of:
   - `Card` (default)
   - `Cash`
   - `Bank Transfer`
   - `Online`
   - `Check`
   - `Other`
8. In the **Transaction ID** field (optional), enter the gateway transaction reference (placeholder: `e.g. txn_1234567890`).
9. In the **Paid At** field (optional), click the date-time picker and select the date and time of payment.
10. In the **Notes** field (optional), enter any additional notes (placeholder: `Additional notes for this payment`).
11. Click **Record Payment** (primary button, `htmlType="submit"`).
    - While the mutation is pending the button shows a loading spinner.
    - On success, the user is navigated to `/payments`.
    - On error, the error is handled by the mutation hook (notification displayed by hook internals).
12. To abandon without saving, click **Cancel** — navigates to `/payments`.

---

## Validation Rules (client-side)
| Field | Rule |
|-------|------|
| Invoice | Required — "Please select an invoice" |
| Amount | Required — "Please enter the payment amount" |
| Payment Method | Not required (defaults to "Card") |
| Transaction ID | Optional |
| Paid At | Optional |
| Notes | Optional |
