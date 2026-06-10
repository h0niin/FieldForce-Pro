# WF-PORTAL-setup-customer-portal — Set Up and Use the Customer Portal

## Prerequisites
- User must have the `settings:manage` permission (Admin).

## Steps — Enable the Customer Portal

1. Go to **Settings** in the left sidebar.
2. Navigate to the **Customer Portal** settings section.
3. Toggle **Enable Customer Portal** to ON.
4. Configure what customers can see:
   - **Work Order Details** — toggle on/off
   - **Invoice & Payment History** — toggle on/off
   - **Technician Live Tracking** — toggle on/off (requires GPS tracking to be active)
   - **Estimate Approval** — toggle on/off
   - **Service Reports / Job Sheets** — toggle on/off
5. Set the **Portal URL** if a custom subdomain is available.
6. Click **Save**.

## Steps — Share Portal Access with a Customer

1. Go to **Contacts** in the sidebar.
2. Open the customer's contact record.
3. Click **Send Portal Access** (or **Send Login Link**).
4. The customer receives an email with a magic link to access their portal.
5. Clicking the link logs them in without a password (magic link authentication).

## Steps — What Customers Can Do in the Portal

Once in the portal, customers can:
- View all their past and current work orders
- View and pay invoices (click **Pay Now** → complete payment via connected gateway)
- Download invoice PDFs and service reports
- Track technician location in real time when the tech is en route
- Approve or reject estimates

## Result
Customers have self-service access to their service history and invoices, reducing inbound support calls and speeding up payment collection.
