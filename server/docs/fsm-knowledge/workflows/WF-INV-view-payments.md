# WF-INV-view-payments — View Invoice Payments

## Overview
Documents how to view payments recorded against an invoice. Payments are read-only on the Invoice Detail page; there is no create, edit, or delete action for payments within the Invoice Detail UI (no onClick handlers, no modal triggers, no form submissions exist on the payments table in `InvoiceDetailPage.tsx`).

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must NOT have a Technician role (TechnicianGuard blocks `/invoices`).
- The sidebar entry for **Invoices** requires permission `invoices:read`.

## Steps

1. In the left sidebar under **Financial**, click **Invoices**. The browser navigates to `/invoices`.
2. Locate the target invoice row and click the **View** icon button (tooltip **"View"**, icon EyeOutlined) in the **Actions** column. The browser navigates to `/invoices/{id}`.
3. Scroll down past the **Invoice Information** card and the **Line Items** card to the card titled **"Payments"**.
4. The payments table is loaded via `useInvoicePayments(id)`. While loading, the table shows a loading indicator.
5. When loaded, the table renders the following columns:

   | Column             | Description                                                                        |
   |--------------------|------------------------------------------------------------------------------------|
   | **Amount**         | Bold currency-formatted amount using invoice currency                              |
   | **Method**         | Tag displaying the payment method (formatted with spaces and title-case)           |
   | **Status**         | Tag with colour coding: pending=blue, completed=green, failed=red, refunded=orange |
   | **Transaction ID** | `gateway_transaction_id` value; em-dash placeholder if absent                      |
   | **Paid At**        | Formatted datetime; em-dash placeholder if absent                                  |
   | **Notes**          | Payment notes text; em-dash placeholder if absent                                  |

6. When there are no payments, the table empty state displays **"No payments recorded"**.

## Recording a New Payment
To record a payment against an invoice, navigate to the separate **Payments** module in the sidebar under **Financial** > **Payments** and use the Payment create workflow. The Invoice Detail page itself does not provide a button or modal to record a payment.

## Notes
- Pagination is disabled on this table (`pagination={false}`).
- The **Paid Amount** and **Balance Due** fields in the **Invoice Information** card above reflect the aggregate of all payments recorded.
- Payment status colours visible in this table: `pending` (blue), `completed` (green), `failed` (red), `refunded` (orange).
