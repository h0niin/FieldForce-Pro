# WF-INV-view-invoice — View Invoice Detail

## Overview
Walks a user through navigating to and reviewing the full detail view for a single invoice, including its line items and payments.

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- User must NOT have a Technician role (TechnicianGuard blocks `/invoices`).
- The **View** (tooltip: **"View"**) icon button in the list table is wrapped in `PermissionGuard permission="invoices:read"`.

## Steps

1. In the left sidebar under **Financial**, click **Invoices**. The browser navigates to `/invoices`.
2. Locate the target invoice row in the table.
3. In the **Actions** column (fixed right), click the icon-only button with tooltip **"View"** (icon: EyeOutlined). The browser navigates to `/invoices/{id}`.
4. While loading, the page header shows **"Invoice Details"** and a Card containing a `Skeleton active` placeholder is displayed.
5. If the invoice is not found, the page header shows **"Invoice Not Found"** and a Card displays the text **"Invoice not found"**.
6. When loaded successfully, the page header shows **"Invoice {invoice_number}"** with a back-arrow button.

### Invoice Information Card
The card titled **"Invoice Information"** contains a bordered `Descriptions` table (2 columns) showing:
- **Invoice Number**
- **Status** (Tag with color: Draft=default, Sent=blue, Viewed=cyan, Partially Paid=gold, Paid=green, Overdue=red, Void=default)
- **Customer** (first_name + last_name from linked contact)
- **Work Order** (wo_number or summary from linked work order)
- **Due Date**
- **Currency** (Tag)
- **Subtotal**
- **Tax**
- **Discount**
- **Total** (bold, font-size 16)
- **Paid Amount** (green if paid_amount >= total, amber otherwise)
- **Balance Due** (total minus paid_amount)
- **Notes** (full-width, span=2)
- **Created At**
- **Updated At**

### Line Items Card
The card titled **"Line Items"** contains a table with columns: **Type**, **Name**, **Description**, **Quantity**, **Unit Price**, **Tax Rate**, **Discount**, **Total**.

The table summary footer rows show:
- **Subtotal**
- **Tax**
- **Discount** (prefixed with a minus sign)
- **Total** (bold, font-size 16)

When no line items exist the table shows the locale text **"No line items added"**.

### Payments Card
The card titled **"Payments"** contains a table with columns: **Amount**, **Method**, **Status** (Tag with color: pending=blue, completed=green, failed=red, refunded=orange), **Transaction ID**, **Paid At**, **Notes**.

When no payments exist the table shows the locale text **"No payments recorded"**.

## Back Navigation
Clicking the back-arrow in the page header navigates to `/invoices`.

## Notes
- Line items are sourced from `useInvoiceLineItems(id)` hook; falls back to `invoice.line_items` if the hook returns nothing.
- Payments are sourced from `useInvoicePayments(id)` hook.
- Both sub-tables disable pagination (`pagination={false}`).
