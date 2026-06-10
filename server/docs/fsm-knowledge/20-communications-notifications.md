# Communications and Notifications

---

## Communications

### What is the Communications Module?
The Communications module tracks all messages exchanged with customers — emails, SMS messages, and other channel communications. It gives you a complete audit trail of every customer interaction.

### Accessing Communications
Click **Communications** in the left sidebar.

### What Is Recorded in Communications

| Field | Description |
|-------|-------------|
| **Channel** | Email, SMS, WhatsApp, Phone (manual log) |
| **Direction** | Inbound (customer sent to you) or Outbound (you sent to customer) |
| **Subject** | The subject line or topic of the message |
| **Body** | The content of the message |
| **Contact** | The customer this communication is with |
| **Status** | Sent, Delivered, Read, Failed |
| **Sent At** | Timestamp of when the message was sent |

### Viewing Communication History
1. Go to **Communications** in the sidebar.
2. The list shows all communications across all customers.
3. Filter by **Channel**, **Direction**, **Contact**, or **Date Range**.
4. Click any row to see the full message content.

### Viewing Communication History for a Specific Customer
1. Open the customer's **Contact** detail page.
2. Scroll to the **Communications** section or click the **Communications** tab.
3. All messages with this customer are shown in chronological order.

### Sending a Communication from the Platform
Certain actions automatically send communications:
- Sending an invoice → outbound email
- Sending an estimate → outbound email
- Dispatching a technician → outbound SMS to customer (if configured)
- Appointment reminder → outbound email/SMS (if configured)

Manual outbound messages can also be sent from a contact's detail page if messaging is enabled.

---

## Notifications

### What Are Notifications?
Notifications are real-time alerts that tell team members about important events — a new job assignment, an appointment change, a customer payment received, etc.

Notifications can be delivered via:
- **In-App** — bell icon in the top navigation bar
- **Email** — sent to the user's email
- **Push Notification** — on the mobile app
- **SMS** — text message to the user's phone

### Viewing Your Notifications
Click the **bell icon** in the top navigation bar to see your notification feed. Unread notifications have a badge counter. Click any notification to go to the relevant record.

### Notification Types

| Event | Who Gets Notified |
|-------|------------------|
| Work order assigned to you | The assigned technician |
| Work order status changed | The dispatcher / manager |
| New appointment created | The assigned technician |
| Appointment time changed | The assigned technician |
| New note added to your work order | All users linked to the WO |
| Invoice sent | Dispatcher (confirmation) |
| Invoice paid | Finance team / Admin |
| Estimate approved by customer | Dispatcher / Sales team |
| SLA approaching breach | Assigned technician + manager |
| SLA breached | Manager + Admin |
| New service request submitted | Dispatcher |
| Timesheet pending approval | Manager |

### Configuring Notification Preferences
1. Go to **Settings → Notifications** (or **Notification Preferences**).
2. For each notification type, toggle on/off for each channel: Email, SMS, Push, In-App.
3. You can set preferences for yourself only (unless you are an Admin).
4. Admins can set default notification preferences for all users in a role.

### Email and SMS Templates
The content of email and SMS notifications is controlled by templates:
1. Go to **Settings → Email/SMS Templates**.
2. Find the template you want to edit (e.g., "Invoice Sent", "Appointment Reminder").
3. Click **Edit**.
4. Modify the **Subject** and **Body** using the available variables:
   - `{{customer_name}}` — the customer's full name
   - `{{invoice_total}}` — the invoice amount
   - `{{appointment_date}}` — the scheduled date and time
   - `{{technician_name}}` — the assigned technician's name
   - `{{company_name}}` — your company name
   - `{{tracking_link}}` — live tracking URL for the customer
5. Click **Save**.

### Turning Off Notifications
To stop receiving a specific type of notification:
1. Go to **Settings → Notifications**.
2. Find the notification type.
3. Toggle off the channels you don't want.

Note: Some critical notifications (e.g., SLA breach alerts for managers) cannot be disabled.
