# Settings & Customization

## Accessing Settings

Click **Settings** in the bottom of the left sidebar.

## Settings Sections

| Section | Purpose |
|---------|---------|
| **Organisation** | Company name, logo, timezone, currency |
| **Users** | Manage team members |
| **Roles & Permissions** | Create and configure roles |
| **Integrations** | Connect third-party tools (payments, maps, etc.) |
| **SLA Policies** | Define response and resolution time targets |
| **Workflow Rules** | Automate actions based on triggers |
| **Webhooks** | Send events to external systems |
| **Email Templates** | Customise customer-facing emails |
| **Custom Fields** | Add extra fields to work orders, contacts, etc. |
| **Billing** | Manage your FieldForce Pro subscription |

## Organisation Settings

1. Go to **Settings → Organisation**.
2. Update:
   - **Company Name** — shown on invoices and customer emails
   - **Logo** — upload a PNG/JPG (recommended: 200×60px, white or transparent background)
   - **Default Timezone** — affects all scheduling and reports
   - **Default Currency** — used in invoices; can be overridden per invoice
   - **Date Format** — DD/MM/YYYY or MM/DD/YYYY
3. Click **Save**.

## SLA Policies

SLAs define how quickly you must respond to and resolve jobs.

### Creating an SLA Policy
1. Go to **Settings → SLA Policies**.
2. Click **+ New Policy**.
3. Fill in:
   - **Policy Name**
   - **Priority** — which work order priority this applies to (Low / Medium / High / Urgent)
   - **First Response Time** — e.g., 2 hours
   - **Resolution Time** — e.g., 8 hours
   - **Business Hours** — whether the clock runs 24/7 or only during business hours
4. Click **Save**.
5. Assign the policy to a customer or a default in Organisation Settings.

## Workflow Rules (Automations)

Workflow rules automatically perform an action when a trigger condition is met.

### Creating a Workflow Rule
1. Go to **Settings → Workflow Rules**.
2. Click **+ New Rule**.
3. Configure:
   - **Trigger** — e.g., `Work Order status changes to Completed`
   - **Conditions** (optional) — e.g., `Priority is Urgent`
   - **Action** — e.g., `Send email to customer`, `Create follow-up task`, `Webhook POST`
4. Click **Save and Activate**.

### Example Rules
- When a work order is `Completed`, automatically create an invoice draft.
- When a service request is `New` for more than 2 hours, escalate priority to `High`.
- When an invoice becomes `Overdue`, send a reminder email to the customer.

## Webhooks

Webhooks let you push real-time event data to an external URL (e.g., a Zapier zap, a CRM, or a custom system).

### Adding a Webhook
1. Go to **Settings → Webhooks**.
2. Click **+ New Webhook**.
3. Enter:
   - **URL** — the destination endpoint
   - **Events** — select which events to subscribe to (e.g., `work_order.completed`, `invoice.paid`)
   - **Secret** — a shared secret for signature verification
4. Click **Save**. FieldForce Pro will send a `POST` request with JSON payload whenever a subscribed event occurs.

## Custom Fields

Add extra fields to entities (Work Orders, Contacts, Assets, etc.) to capture business-specific data.

### Adding a Custom Field
1. Go to **Settings → Custom Fields**.
2. Select the entity type (e.g., `Work Order`).
3. Click **+ Add Field**.
4. Choose field type: `Text`, `Number`, `Date`, `Dropdown`, `Checkbox`, `File Upload`.
5. Enter a label and default value (optional).
6. Click **Save**. The field appears on all instances of that entity.

## Email Templates

Customise the emails sent to customers for invoices, estimates, appointment reminders, etc.

1. Go to **Settings → Email Templates**.
2. Select a template (e.g., `Invoice Sent`, `Appointment Reminder`).
3. Edit the subject line and body using the rich-text editor.
4. Use template variables like `{{customer_name}}`, `{{invoice_total}}`, `{{appointment_date}}`.
5. Click **Save**. Changes apply to all future emails of that type.

## Dark Mode

Toggle between light and dark mode using the **sun/moon icon** in the top navigation bar. This preference is saved per user and does not affect other users.
