# Customer Portal

## What is the Customer Portal?

The Customer Portal is a self-service web page for your customers. Instead of calling to check on their job status, customers can log in to the portal and:
- See their service history
- View and pay invoices online
- Track their technician in real time on a map
- Approve or reject estimates
- Download job reports and receipts

The portal is completely separate from the main FieldForce Pro app — customers never see your internal operations or other customers' data.

---

## Accessing the Portal (Customer View)

Customers access the portal via:
- A link in any email sent to them (invoice, estimate, appointment confirmation)
- A dedicated URL provided by your company (e.g., `portal.yourcompanyname.com`)

Customers log in with their email address. A magic link (one-time login link) is sent to their email — no password needed.

---

## What Customers Can Do in the Portal

### View Service History
- See a list of all past and current work orders
- Click any work order to see: job summary, status, technician details, scheduled date, completed date
- View attached photos and job sheets (if shared)

### View and Pay Invoices
- See all invoices with status (Draft, Sent, Paid, Overdue)
- Click an invoice to see the full breakdown of charges
- Click **Pay Now** to pay online via the connected payment gateway (Stripe, Square, etc.)
- Download a PDF receipt after payment

### Track Technician in Real Time
- When a technician is dispatched and in transit, the portal shows a live map with the technician's current location
- The map updates every few seconds
- An ETA is shown based on current traffic (if available)
- Customers can see the technician's name, photo, and a call button

### Approve or Reject Estimates
- When an estimate is sent, the customer receives an email with a portal link
- They can review the line items, notes, and terms
- Click **Approve** to accept or **Reject** with a comment
- If a signature is required, they can sign on the portal directly

### View and Download Documents
- Download invoice PDFs, estimate PDFs, and service reports
- All documents are branded with your company logo

---

## Portal Settings (Admin)

### Enabling/Disabling the Portal
Go to **Settings → Customer Portal** to:
- Enable or disable portal access for all customers
- Configure what customers can see (hide/show payment history, hide/show technician tracking, etc.)
- Set the portal URL / subdomain

### What Information Is Shown in the Portal
Admins control visibility:
- Work order details — on/off
- Invoice payments — on/off
- Technician live tracking — on/off (requires GPS tracking to be active)
- Estimate approval — on/off
- Job sheet / service report — on/off

### Resending Portal Access to a Customer
If a customer cannot find their portal login link:
1. Go to **Contacts** and open the customer's record.
2. Click **Send Portal Access** (or **Resend Login Link**).
3. The customer receives a new magic link email.

---

## Customer Portal vs. Customer Email Links

| | Portal Login | Email Link |
|--|------------|------------|
| **Requires login?** | Yes (magic link) | No |
| **See history?** | Yes | No — one specific record only |
| **Pay invoices?** | Yes | Yes (if payment link is in email) |
| **Track technician?** | Yes | Yes (if tracking link is in email) |
| **All records?** | Yes | No — only that specific invoice/estimate |
