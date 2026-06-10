# FAQ — Common Questions from New Users

---

## General / Getting Started

**Q: What is FieldForce Pro?**
FieldForce Pro is a field service management platform. It helps businesses that send workers to customer locations manage their operations — scheduling jobs, dispatching technicians, creating estimates and invoices, tracking technicians in real time, and analysing performance.

**Q: Where do I start after signing up?**
Follow the Getting Started checklist:
1. Set up your Organisation details (Settings → Organisation)
2. Invite your team members (Settings → Users → + Invite User)
3. Add your Services and Parts to the Catalog
4. Add your Customers (Contacts)
5. Create your first Work Order

**Q: What is the difference between a contact and a company?**
A Contact is an individual person (a customer). A Company is a business organisation. If a contact works for a business, you link them to a Company. One company can have many contacts (e.g., different people at the same business who request service).

**Q: What is a work order vs. a service request vs. an estimate?**
- A **Service Request** is an incoming request from a customer — it has not been accepted or scheduled yet.
- An **Estimate** is a pricing quote you send to a customer for approval.
- A **Work Order** is the actual job — once approved and scheduled, this is what the technician works on.
The typical flow is: Service Request → Estimate → Work Order.

---

## Work Orders

**Q: How do I create a work order?**
Go to **Work Orders → + New Work Order**. Fill in the Summary, Customer, and Service Location, then click Save.

**Q: Can I create a work order without an estimate?**
Yes. Work orders can be created directly without going through the estimate process.

**Q: Why can't I change the status of a work order?**
Status transitions follow a strict path. For example, you cannot move a work order from "New" to "Completed" — it must go through Scheduled → In Progress → Completed. If the button you expect is not shown, the current status does not allow that transition yet.

**Q: How do I generate an invoice from a work order?**
The work order must be in "Completed" status (or later). Then open the work order and click **Generate Invoice** or go to the **Invoice** tab.

**Q: How do I assign a technician to a work order?**
Open the work order and click **Assign Technician** (top-right), or click the **Assigned To** field. Search for the technician and click Save.

**Q: Can I assign multiple technicians to one work order?**
Yes. Click **+ Add Technician** in the Assigned Technicians section of the work order.

**Q: How do I add parts and labour to a work order?**
Go to the **Line Items** tab on the work order and click **+ Add Line Item**. Choose Part or Labour, fill in the details, and click Add.

---

## Scheduling

**Q: What is the Dispatch Board?**
The Dispatch Board is the Gantt chart view in the Scheduling module. It shows all technicians as rows with their appointments as coloured blocks. You can drag and drop to reschedule, and assign unscheduled jobs to time slots.

**Q: How do I schedule a job for a technician?**
Go to **Scheduling → Dispatch Board**. Find the unscheduled work order in the left panel and drag it onto the technician's row at the correct time. Alternatively, click an empty slot on the board and fill in the appointment form.

**Q: How do I see where my technicians are right now?**
Go to **Scheduling → Map View** (or **Dashboard → Live Map Dashboard**) to see real-time technician locations on a map.

**Q: What does it mean to "dispatch" a technician?**
Dispatching changes the appointment status from "Scheduled" to "Dispatched" — it signals to the technician that they should head to the job site now. The technician receives a notification.

**Q: Can the AI auto-schedule jobs?**
Yes. On the Dispatch Board, click **AI Auto-Schedule**, select the unscheduled work orders to optimise, and click **Run Optimisation**. The AI suggests the best technician-to-job assignments based on location, skills, and availability. You can review and apply or discard the suggestion.

---

## Estimates

**Q: How do I send an estimate to a customer?**
Create the estimate, add at least one line item, then click **Save & Send for Review** (sends immediately) or **Save Draft** first and then **Send Estimate** from the detail page.

**Q: What happens when a customer approves an estimate?**
If the customer approved via the email link, the estimate status changes to "Approved" automatically. You then click **Convert to Work Order** to create the job.

**Q: Can I edit an estimate after it has been sent?**
Yes, but once the estimate is in "Approved" status, it is locked. You can still edit sent estimates (status "Sent") by opening the estimate and clicking Edit.

**Q: Why does it say "Only the assigned estimator can create estimates"?**
This means you either do not have the `estimates:create` permission, or you are not listed as the estimator for this service request. Contact your admin to check your role and permissions.

---

## Invoices and Payments

**Q: How do I create an invoice?**
Option 1: Generate from a completed work order — open the work order (must be Completed) and click **Generate Invoice**.
Option 2: Create manually — go to **Invoices → + New Invoice**, select the customer, add line items, and save.

**Q: How do I record a payment?**
Open the invoice and click **Record Payment**. Enter the amount, payment method (cash, card, bank transfer, etc.), date, and optional reference. Click Save.

**Q: A customer paid online via Stripe. Does it record automatically?**
Yes. When a customer clicks Pay Now in the invoice email and completes payment via Stripe (or other connected gateway), the payment is recorded automatically and the invoice status updates.

**Q: How do I void an invoice?**
Open the invoice and click **Void Invoice**. You must enter a reason. Voided invoices cannot be un-voided. If you need to re-invoice, create a new invoice.

**Q: What does "Invoice Aging" mean?**
Invoice aging refers to how long an invoice has been overdue — unpaid past its due date. Grouped into 30-day, 60-day, and 90+ day buckets in the Invoice Aging Report.

---

## Mobile App

**Q: How do technicians use FieldForce Pro on their phone?**
Technicians download the FieldForce Pro mobile app (iOS or Android). They log in with their email and password. Their assigned jobs appear on the Schedule tab. They can update status, add notes, upload photos, clock in/out, and complete job sheets — all from the app.

**Q: What happens if a technician loses internet connection?**
The app works offline. Previously loaded work orders, contacts, and job sheets are accessible. Any updates (notes, status changes, photos) are saved locally and synced automatically when the connection is restored. A yellow banner appears in the app when offline.

**Q: How does a technician navigate to a job site?**
Open the work order on the mobile app and tap **Navigate**. This opens the phone's native maps app (Google Maps or Apple Maps) with turn-by-turn directions to the job site.

**Q: How do I reset a technician's password?**
Two options:
1. The technician can use the **Forgot Password** link on the login screen.
2. An admin can go to **Settings → Users → [Technician] → Send Password Reset Email**.

---

## Users and Permissions

**Q: How do I invite a new user?**
Go to **Settings → Users → + Invite User**. Enter their name, email, and role. They receive an email with a magic link to set their password and log in.

**Q: What is the difference between an Admin, Dispatcher, Technician, and Manager?**
- **Admin** — full access to everything including settings, billing, all records
- **Dispatcher** — manages day-to-day operations: service requests, work orders, scheduling, contacts
- **Technician** — sees only their own assigned work orders (mainly uses the mobile app)
- **Manager** — read-only access plus the ability to approve timesheets and review reports

**Q: Can I create a custom role with specific permissions?**
Yes. Go to **Settings → Roles & Permissions → + New Role**. Name the role and toggle the exact permissions you want.

**Q: How do I deactivate a user who has left the company?**
Go to **Settings → Users**, find the user, click the **Actions** menu (three dots), and click **Deactivate**. Their account is immediately disabled but all their historical records are preserved.

---

## Settings and Customisation

**Q: How do I change my company logo?**
Go to **Settings → Organisation**. Click the logo area and upload a PNG or JPG image (recommended 200×60 pixels).

**Q: How do I set up automatic email reminders?**
Go to **Settings → Workflow Rules → + New Rule**. Set the trigger (e.g., "Invoice due date is tomorrow") and the action (e.g., "Send email to customer"). Activate the rule.

**Q: How do I add a custom field to work orders?**
Go to **Settings → Custom Fields → Work Orders → + Add Field**. Choose the field type (Text, Number, Dropdown, etc.) and save.

**Q: How do I connect my payment gateway (Stripe, Square, PayPal)?**
Go to **Settings → Integrations → Payments**. Select your provider and follow the OAuth authentication steps.

**Q: How do I change the timezone or currency?**
Go to **Settings → Organisation** and update the **Timezone** and **Currency** fields. Click Save.

---

## Troubleshooting

**Q: I cannot log in. What should I do?**
1. Check you are using the correct email address.
2. Try **Forgot Password** to reset your password.
3. Check your email for a magic link if you were invited by an admin.
4. If 2FA is enabled, check your email or authenticator app for the verification code.
5. Contact your admin to verify your account is not deactivated.

**Q: I get a "You do not have permission" error.**
Your user role does not include the permission needed for that action. Contact your admin to review your role and add the necessary permission in **Settings → Roles & Permissions**.

**Q: The map is not showing technician locations.**
1. Check the technician has the mobile app installed and is logged in.
2. Check that location permission is set to **Always Allow** in the phone's settings.
3. The technician must have an active appointment for tracking to activate.
4. Check the phone has internet connectivity.

**Q: My work order line items are not appearing on the invoice.**
The invoice must be generated from the work order (not created manually) for line items to be pre-populated. Open the completed work order and click **Generate Invoice** from the Invoice tab.

**Q: Why is the estimate form not showing the "Create Estimate" button?**
The Create Estimate button only appears when you are on the **Drafts** tab of the Estimates list. Make sure you are on that tab, not the All Estimates or Approved tab.
