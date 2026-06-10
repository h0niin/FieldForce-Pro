# Getting Started with FieldForce Pro

FieldForce Pro is a complete Field Service Management (FSM) platform. This guide helps new users understand the platform, set it up correctly, and become productive quickly.

---

## What Can FieldForce Pro Do for Me?

FieldForce Pro manages the entire lifecycle of field service work:

1. **Receive a service request** from a customer (phone, email, web form)
2. **Create and send an estimate** for approval
3. **Convert to a work order** once approved
4. **Schedule and dispatch** a technician to the job site
5. **Technician completes the job** on mobile (checklist, photos, signature)
6. **Generate and send an invoice** automatically
7. **Record payment** from the customer
8. **Analyse results** through reports and dashboards

---

## First-Time Setup Checklist (Do These in Order)

### Step 1 — Set Up Your Organisation
1. Go to **Settings → Organisation** in the sidebar.
2. Enter your **Company Name**, upload your **Logo**, and set your **Timezone**, **Currency**, and **Date Format**.
3. Click **Save**.

### Step 2 — Invite Your Team
1. Go to **Settings → Users**.
2. Click **+ Invite User** for each team member.
3. Assign the correct role:
   - **Admin** — full access, settings, billing
   - **Dispatcher** — manages work orders, scheduling, contacts
   - **Technician** — sees only their assigned jobs (mainly on mobile)
   - **Manager** — read-only access plus approvals and reports
4. Users receive an email with a magic link to set their password.

### Step 3 — Add Your Services and Parts
1. Go to **Catalog → Services** and click **+ Add Service** for each service you offer (e.g., "HVAC Service Call", "Electrical Inspection").
2. Go to **Catalog → Parts** and click **+ Add Part** for each part you carry in stock.
3. This lets you quickly add line items to estimates and invoices.

### Step 4 — Add Your Customers (Contacts)
1. Go to **Contacts** in the sidebar.
2. Click **+ New Contact** to add customers manually.
3. Alternatively, customers who submit a web form will be auto-created.
4. Link each contact to a **Service Location** (the address where you do work).

### Step 5 — Create Your First Work Order
1. Go to **Work Orders → + New Work Order**.
2. Select the Customer, Service Location, and fill in the job summary.
3. Save. The work order is now in **New** status.

### Step 6 — Set Up Scheduling
1. Go to **Scheduling** in the sidebar.
2. Open the **Dispatch Board** (Gantt chart view).
3. Drag the work order onto a technician's row at the correct time.
4. The technician receives a push notification on their mobile app.

---

## Understanding the Sidebar Navigation

| Section | What It Does |
|---------|-------------|
| **Dashboard** | Real-time overview of jobs, revenue, and technician activity |
| **Service Requests** | Incoming requests from customers before they become work orders |
| **Work Orders** | Active jobs being managed and executed |
| **Scheduling** | Calendar, Gantt board, and live map for dispatching technicians |
| **Contacts** | Customer contact records |
| **Companies** | Business/organisation records linked to contacts |
| **Service Locations** | Addresses where work is performed |
| **Assets** | Equipment and machinery you maintain for customers |
| **Estimates** | Quotes sent to customers before work begins |
| **Invoices** | Bills sent to customers after work is completed |
| **Payments** | Payment records linked to invoices |
| **Timesheets** | Hours logged by technicians on jobs |
| **Reports** | Analytics and reporting on operations and revenue |
| **Settings** | Platform configuration, users, roles, integrations |

---

## Key Concepts for New Users

### What is a Work Order?
A work order is the central record for a job. It tracks what needs to be done, who will do it, when it is scheduled, what parts and labour were used, and what was charged. Everything in the platform connects back to the work order.

### What is a Service Request?
A service request is a customer's request for help, before it becomes a work order. It goes through an approval process first. Once approved, it is converted into a work order.

### What is an Estimate?
An estimate (also called a quote) is a pricing proposal sent to the customer before work begins. The customer can approve or reject it. When approved, it can be converted into a work order automatically.

### What is a Service Appointment?
A service appointment is a scheduled time slot for a technician to visit the job site. It is linked to a work order. One work order can have multiple appointments if the job takes multiple visits.

### What is an Invoice?
An invoice is the bill sent to the customer after work is completed. It is generated from the work order's line items (labour, parts, materials). Payments are recorded against the invoice.

---

## User Roles — Who Can Do What?

| Role | Can Do |
|------|--------|
| **Admin** | Everything — create users, configure settings, manage billing, access all records |
| **Dispatcher** | Create and manage service requests, work orders, scheduling, contacts |
| **Technician** | View and update their own assigned work orders, log time, add photos/notes |
| **Manager** | Read all records, approve timesheets, view reports, cannot edit most things |

---

## Common First Questions

**Q: How do I add a customer?**
Go to **Contacts → + New Contact** and fill in their name, email, and phone number.

**Q: How do I see what jobs are scheduled for today?**
Go to **Scheduling → Dispatch Board** and click **Today** at the top. Or check the **Dashboard** for a daily overview.

**Q: How do I know if a technician is on their way to a job?**
Go to **Scheduling → Map View** to see real-time technician locations on a map.

**Q: How does a technician see their schedule?**
Technicians log in to the **mobile app**. Their assigned appointments appear on the **Schedule** tab.

**Q: How do I send an invoice to a customer?**
Open the invoice (or generate one from the completed work order), then click **Send Invoice**. The customer receives it by email.

**Q: How do I get paid?**
Go to **Settings → Integrations → Payments** and connect Stripe, Square, or PayPal. Customers can then pay online from the invoice email.

**Q: Where do I set up automated notifications?**
Go to **Settings → Notifications** to configure which email/SMS/push alerts are sent automatically (e.g., appointment reminders, invoice sent confirmations).

---

## Getting Help

- Click the **AI Assistant** button (chat icon in the top navigation bar) to ask any question about using the platform.
- Contact support at support@bairuhatech.com for technical issues.
