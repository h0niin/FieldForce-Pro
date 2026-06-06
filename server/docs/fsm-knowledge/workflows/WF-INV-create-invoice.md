# WF-INV-create-invoice — Create Invoice

## Overview
Walks a user through creating a new invoice from the sidebar navigation to form submission.

## Prerequisites
- User must be authenticated (PrivateRoute guard enforced at router level).
- User must NOT have a Technician role (TechnicianGuard blocks access to `/invoices`; technicians are redirected to `/dashboard`).
- No permission guard wraps the "Create" route or form; the sidebar entry for Invoices requires permission `invoices:read` to be visible.

## Steps

1. In the left sidebar, locate the **Financial** section and click **Invoices** (icon: DollarOutlined). The browser navigates to `/invoices`.
2. On the Invoice List page the page header shows title from translation key `nav.invoices` and subtitle **"Manage invoices"**. There is no "New Invoice" / "Create Invoice" button rendered on this list page — navigate directly to the create URL by typing `/invoices/new` in the address bar, OR follow any application link that targets that path.
3. The browser loads the `InvoiceFormPage` at `/invoices/new`. The page header displays the title **"Create Invoice"** with a back-arrow button.
4. Complete the form fields (all are optional — no `rules` validators are set):
   - **Customer (Contact)** — searchable Select; type to filter by name or email; shows options in format `FirstName LastName (email@example.com)`. Select one contact or leave blank.
   - **Work Order** — searchable Select; options displayed as `WO_NUMBER - summary`. Select one work order or leave blank.
   - **Due Date** — DatePicker. Click the field to open the calendar picker and select a date.
   - **Currency** — Select; default value is **USD**. Options: **USD**, **EUR**, **GBP**, **CAD**, **AUD**, **INR**.
   - **Notes** — TextArea (4 rows); placeholder text **"Additional notes for this invoice"**.
5. Click **Create** (primary button, `htmlType="submit"`). While the mutation is in flight the button shows a loading spinner (`createInvoice.isPending`).
6. On success the mutation hook navigates the user to `/invoices` (the Invoice List page).
7. To abort without saving, click **Cancel** (secondary button). The user is navigated to `/invoices`.

## Back Navigation
Clicking the back-arrow in the page header (rendered by `PageHeader` `onBack` prop) also navigates to `/invoices`.

## Notes
- The form uses `initialValues={{ currency: 'USD' }}`, so Currency defaults to USD even before the user interacts with it.
- Line items cannot be created through this form. The `InvoiceFormPage` covers only the invoice header fields. Line items are read-only on the Detail page.
- Error handling for failed submissions is delegated entirely to the mutation hooks (no inline error display in the form itself).
