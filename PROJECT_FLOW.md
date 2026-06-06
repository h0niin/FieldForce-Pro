# **FieldForce Pro - Complete Project Flow Documentation**

**Version:** 1.0
**Last Updated:** February 24, 2026
**Author:** BairuHa Tech LLP
**Project:** AI-Powered Field Service Management Platform

---

## **Table of Contents**

1. [Primary Service Delivery Workflow](#1-primary-service-delivery-workflow)
2. [State Transition Workflows](#2-state-transition-workflows)
3. [Recurring & Automated Workflows](#3-recurring--automated-workflows)
4. [AI/ML Integration Workflows](#4-aiml-integration-workflows)
5. [Multi-Tenancy Workflow](#5-multi-tenancy-workflow)
6. [Offline-First Mobile Workflow](#6-offline-first-mobile-workflow)
7. [Approval Workflow](#7-approval-workflow)
8. [Webhook & Integration Workflow](#8-webhook--integration-workflow)
9. [Development Workflow](#9-development-workflow)
10. [Key Workflow Principles](#10-key-workflow-principles)

---

## **1. Primary Service Delivery Workflow**

This is the **end-to-end customer journey** from initial request to completion:

### **Phase 1: Request Intake** (Multi-Channel)

```
Customer submits service request via:
├─ Webform (embedded on customer website)
├─ Email (parsed automatically)
├─ Phone call (dispatcher manual entry)
├─ Customer Portal (self-service)
├─ WhatsApp/SMS
└─ API (from CRM/ERP integration)
    ↓
AI Auto-Categorization (NLP):
├─ Extract service type, urgency, keywords
├─ Sentiment analysis → Escalate angry customers
├─ Auto-assign priority: Low/Medium/High/Critical
└─ Suggest matching technician based on skills
    ↓
SERVICE_REQUESTS table created
Status: "New"
```

**Database Changes:**
- `SERVICE_REQUESTS` record created
- `AUDIT_LOGS` entry for creation

**Notifications:**
- Dispatcher: Push notification + email
- Customer: Confirmation email/SMS

---

### **Phase 2: Triage & Estimation**

```
Dispatcher reviews request
    ↓
Status: "New" → "Triaged"
    ↓
Create Estimate:
├─ AI suggests line items from request description
│   ├─ Service items (from SERVICES_CATALOG)
│   ├─ Parts needed (from PARTS_CATALOG)
│   └─ Travel/labor time (ML prediction based on historical data)
├─ Dispatcher adjusts pricing (Good/Better/Best tiers from PRICEBOOK)
├─ Add tax, discount, notes
└─ Generate PDF with branded template
    ↓
ESTIMATES table created
Status: "Draft"
    ↓
Send to customer (email/SMS with tracking pixel)
Status: "Draft" → "Sent" → "Viewed" (when customer opens)
```

**Database Changes:**
- `ESTIMATES` record created
- `ESTIMATE_LINE_ITEMS` records created (one per service/part)
- `SERVICE_REQUESTS` status updated to "Triaged"
- `COMMUNICATION` log entry for email sent

**AI Integration:**
- POST `/api/estimates/generate` (AI service)
- Returns suggested line items with pricing

**Notifications:**
- Customer: Email with PDF + approval link
- Dispatcher: "Estimate sent" confirmation

---

### **Phase 3: Approval & Conversion**

```
Customer reviews estimate in Customer Portal
    ↓
Options:
├─ Approve → Digital signature captured → "Approved"
├─ Reject → "Rejected" (dispatcher notified)
└─ No action → Auto-expiry after 7 days → "Expired"
    ↓
If "Approved":
    ↓
Convert Estimate to Work Order (automatic):
├─ Copy all line items to WORK_ORDER_LINE_ITEMS
├─ Link to original SERVICE_REQUESTS and ESTIMATES
├─ Inherit customer, location, asset info
└─ Apply Blueprint state machine for WO lifecycle
    ↓
WORK_ORDERS table created
Status: "New"
    ↓
SERVICE_REQUESTS status → "Converted to WO"
```

**Database Changes:**
- `ESTIMATES` status: "Sent" → "Approved"
- `WORK_ORDERS` record created
- `WORK_ORDER_LINE_ITEMS` records created (copied from estimate)
- `SERVICE_REQUESTS` status: "Triaged" → "Converted to WO"

**Business Logic:**
- Signature URL stored in S3/GCS
- Estimate locked (no further edits allowed)
- Work order inherits all custom fields

**Notifications:**
- Dispatcher: "New work order ready to schedule"
- Customer: "Your estimate has been approved"

---

### **Phase 4: Scheduling & Dispatch**

```
Dispatcher opens Dispatch Board (Gantt chart or Calendar view)
    ↓
AI-Powered Scheduling Engine analyzes:
├─ Work order priority, estimated duration, location
├─ Technician skills, availability, shift hours
├─ Territory assignments
├─ Time-off, holidays
├─ Existing appointments (no conflicts)
├─ Travel time optimization (VRP solver via AI service)
└─ SLA deadlines (from SERVICE_AGREEMENTS if applicable)
    ↓
AI suggests optimal schedule:
├─ Multi-stop route for each technician
├─ Minimizes total travel time
└─ Balances workload across team
    ↓
Dispatcher reviews & confirms (or manually adjusts via drag-drop)
    ↓
WORK_ORDERS status: "New" → "Scheduled"
    ↓
SERVICE_APPOINTMENTS table created:
├─ Links WO to specific agent/crew
├─ Sets scheduled_start and scheduled_end times
├─ Status: "Scheduled"
    ↓
Notifications sent:
├─ Technician: Push notification + SMS (appointment details, address, job sheet)
├─ Customer: SMS/email confirmation with tracking link
└─ Dispatcher: Calendar updated
```

**Database Changes:**
- `WORK_ORDERS` status: "New" → "Scheduled"
- `SERVICE_APPOINTMENTS` record created
- `SCHEDULING` record created (AI-generated route)
- `NOTIFICATIONS` entries created for all parties

**AI Integration:**
- POST `/api/schedule/optimize`
- Request body:
  ```json
  {
    "work_order_ids": ["uuid1", "uuid2"],
    "date": "2026-02-25",
    "optimize_for": "travel_time"
  }
  ```
- Response: Optimized schedule with technician assignments

**Notifications:**
- Technician: Push + SMS with job details
- Customer: "Your appointment is scheduled for [date/time]"
- Dispatcher: Calendar view updated (WebSocket event)

---

### **Phase 5: Technician Workflow (Mobile App)**

```
Technician opens mobile app (iOS/Android)
    ↓
Views daily schedule on "Schedule" tab
    ↓
Accepts appointment
    ↓
SERVICE_APPOINTMENTS status: "Scheduled" → "Dispatched"
    ↓
Starts trip:
├─ Taps "Start Trip" button
├─ GPS tracking begins (breadcrumbs to AGENT_LOCATIONS)
├─ Route displayed on map (Mapbox/Google Maps)
├─ Navigation to customer site
└─ TRIPS table entry created (start_lat, start_lng, start_time)
    ↓
SERVICE_APPOINTMENTS status: "Dispatched" → "In Transit"
TIMESHEETS created: clock_in timestamp
    ↓
Arrives on-site:
├─ Tap "I'm On-Site" (geofence verification)
├─ Customer receives "Technician arrived" notification
└─ SERVICE_APPOINTMENTS status: "In Transit" → "On Site"
    ↓
Begins work:
├─ SERVICE_APPOINTMENTS status: "On Site" → "In Progress"
├─ WORK_ORDERS status: "Scheduled" → "In Progress"
└─ TIMESHEETS: travel_time calculated, work_time starts
    ↓
Complete Job Sheet (checklist):
├─ JOB_SHEET_INSTANCES created from JOB_SHEET_TEMPLATES
├─ Technician fills out:
│   ├─ Checkboxes (tasks completed)
│   ├─ Text fields (notes, meter readings)
│   ├─ Photos (before/after, equipment serial number)
│   ├─ Signature (technician confirms work done)
│   └─ Parts used (updates PARTS_CATALOG stock)
└─ AI Computer Vision (optional):
    ├─ Verifies work quality from photos
    ├─ Detects equipment model
    └─ Flags quality issues
    ↓
Add notes/attachments:
├─ Voice-to-text transcription (Whisper AI)
├─ WORK_ORDER_NOTES created
└─ WORK_ORDER_ATTACHMENTS (photos, documents)
    ↓
Customer signature:
├─ Digital signature canvas
├─ Signature saved (S3/GCS)
└─ Linked to JOB_SHEET_INSTANCES or WORK_ORDERS
    ↓
Mark complete:
├─ SERVICE_APPOINTMENTS status: "In Progress" → "Completed"
├─ WORK_ORDERS status: "In Progress" → "Completed"
└─ End trip (distance calculated, mileage logged in TRIPS)
    ↓
TIMESHEETS: clock_out timestamp, total hours calculated
```

**Database Changes:**
- `SERVICE_APPOINTMENTS` status transitions (6 updates)
- `WORK_ORDERS` status transitions (2 updates)
- `TRIPS` record created/updated
- `TIMESHEETS` record created/updated
- `JOB_SHEET_INSTANCES` created
- `JOB_SHEET_ITEMS` records created (one per checklist item)
- `WORK_ORDER_NOTES` records created
- `WORK_ORDER_ATTACHMENTS` records created
- `AGENT_LOCATIONS` records created (GPS breadcrumbs every 30 seconds)

**AI Integration:**
- POST `/api/vision/verify-work` (Computer Vision)
  - Uploads photos for quality verification
  - Returns quality score and detected issues
- POST `/api/voice/transcribe` (Voice AI)
  - Uploads audio recording
  - Returns transcribed text for notes

**Notifications:**
- Customer: "Technician on the way" (In Transit)
- Customer: "Technician arrived" (On Site)
- Customer: "Work completed" (Completed)
- Dispatcher: Real-time status updates via WebSocket

**Offline Support:**
- All data synced to WatermelonDB before trip starts
- Photos/signatures queued locally if offline
- Sync when network available

---

### **Phase 6: Post-Service Documentation**

```
Service Report Auto-Generated (AI):
├─ LLM reads job sheet, notes, photos
├─ Generates narrative summary
├─ Formats before/after photo comparison
├─ Creates PDF report
└─ SERVICE_REPORTS table entry created
    ↓
Report sent to customer (email with PDF)
    ↓
Customer receives tracking link:
├─ View work details
├─ See photos
├─ Download invoice
└─ Pay online
```

**Database Changes:**
- `SERVICE_REPORTS` record created
- `COMMUNICATION` log entry for email sent

**AI Integration:**
- POST `/api/documents/generate-report`
- Request body:
  ```json
  {
    "work_order_id": "uuid",
    "template": "standard_service_report"
  }
  ```
- Response: PDF URL in S3/GCS

**Notifications:**
- Customer: Email with PDF report attachment

---

### **Phase 7: Invoicing & Payment**

```
Invoice Auto-Generated:
├─ Pulls line items from WORK_ORDER_LINE_ITEMS
├─ Adds labor hours from TIMESHEETS
├─ Calculates tax, discount, total
├─ Applies branded template
└─ INVOICES table entry created
    ↓
Invoice status: "Draft"
    ↓
Dispatcher reviews & approves
    ↓
Send invoice:
├─ Email/SMS with payment link
├─ Customer Portal view
└─ Status: "Draft" → "Sent" → "Viewed"
    ↓
Payment options:
├─ On-site (Stripe Terminal tap-to-pay during appointment)
├─ Online (Customer Portal → Stripe/Razorpay)
├─ Cash/check (manual recording)
└─ Partial payments allowed
    ↓
Payment recorded:
├─ PAYMENTS table entry created
├─ Payment gateway webhook updates status
├─ Invoice status: "Viewed" → "Paid" (or "Partially Paid")
└─ Customer receives receipt
    ↓
If overdue:
├─ Automated reminders (cron job)
├─ Status: "Sent" → "Overdue"
└─ Late fee auto-added (if configured)
```

**Database Changes:**
- `INVOICES` record created
- `INVOICE_LINE_ITEMS` records created
- `PAYMENTS` record created (when paid)
- Invoice status transitions

**Payment Gateway Integration:**
- **Stripe:**
  - POST `/api/payments/stripe/create-intent`
  - Webhook: `/api/payment-gateways/stripe/webhook`
- **Razorpay:**
  - POST `/api/payments/razorpay/create-order`
  - Webhook: `/api/payment-gateways/razorpay/webhook`

**Notifications:**
- Customer: Invoice sent (with PDF)
- Customer: Payment reminder (3 days before due)
- Customer: Payment reminder (1 day before due)
- Customer: Overdue notice (day after due)
- Customer: Payment receipt (on payment)
- Dispatcher: Payment received notification

---

### **Phase 8: Post-Service Engagement**

```
Review Solicitation (automated):
├─ 24 hours after completion
├─ SMS/email with Google/Yelp review link
└─ REVIEWS table stores feedback
    ↓
Analytics Dashboard Updated:
├─ Revenue by service type
├─ Technician performance (completion time, customer rating)
├─ SLA compliance
├─ Part usage trends
└─ Predictive KPIs (churn risk, revenue forecast)
    ↓
AI Models Retrained:
├─ Route optimizer (learned travel patterns)
├─ Demand forecasting (seasonal trends)
├─ Pricing suggestions (conversion rates)
└─ Equipment failure prediction (maintenance data)
    ↓
Close Work Order:
├─ Dispatcher reviews for quality
└─ WORK_ORDERS status: "Completed" → "Closed"
```

**Database Changes:**
- `REVIEWS` record created (when customer responds)
- `WORK_ORDERS` status: "Completed" → "Closed"
- Analytics tables updated (aggregations)

**AI Integration:**
- Background Celery tasks for model retraining
- Batch processing of completed jobs for pattern learning

**Notifications:**
- Customer: Review request (email + SMS)
- Technician: Customer rating received (if 4-5 stars)
- Manager: Low rating alert (if 1-2 stars)

---

## **2. State Transition Workflows**

### **A. Work Order Lifecycle**

```
New
  → (Estimate created) → Estimated
  → (Customer approves) → Approved
  → (Dispatcher schedules) → Scheduled
  → (Tech starts work) → In Progress
  → (Issue/waiting) → On Hold → (Resume) → In Progress
  → (Tech completes) → Completed
  → (Dispatcher closes) → Closed

Alternate: Any state → Cancelled
```

**Blueprint Engine Enforces:**
- **Role-based transitions:** Only dispatchers can approve
- **Required fields:** Can't schedule without assigned agent
- **Webhook triggers:** Notify customer on status change
- **Guard conditions:** Can't complete without signature

**Database Table:** `BLUEPRINT_TRANSITIONS`

**Example Transition Configuration:**
```json
{
  "from_state": "Scheduled",
  "to_state": "In Progress",
  "name": "Start Work",
  "allowed_roles": ["technician", "admin"],
  "required_fields": ["assigned_to", "scheduled_start"],
  "guard_condition": "user.id === work_order.assigned_to",
  "webhook_url": "https://api.example.com/webhooks/wo-started"
}
```

---

### **B. Service Appointment Lifecycle**

```
Scheduled
  → (Dispatcher assigns) → Dispatched
  → (Tech starts trip) → In Transit
  → (Tech arrives) → On Site
  → (Tech begins work) → In Progress
  → (Pause/issue) → On Hold → (Resume) → In Progress
  → (Job done) → Completed

Alternate: Scheduled/Dispatched → Cancelled (reschedule)
```

**Status Transitions:**
- `Scheduled → Dispatched`: Triggered by assignment
- `Dispatched → In Transit`: Mobile app "Start Trip" button
- `In Transit → On Site`: Geofence detection or manual tap
- `On Site → In Progress`: Mobile app "Start Work" button
- `In Progress → On Hold`: Temporary pause (waiting for parts)
- `On Hold → In Progress`: Resume work
- `In Progress → Completed`: Job sheet completed + signature

**Geofence Verification:**
- 200m radius around service location
- Auto-transition when technician enters geofence
- Fallback: Manual "I'm On-Site" button

---

### **C. Estimate Lifecycle**

```
Draft
  → (Send to customer) → Sent
  → (Customer opens link) → Viewed
  → (Customer signs) → Approved → Convert to WO
  OR
  → (Customer declines) → Rejected
  OR
  → (No response, 7 days) → Expired
```

**Tracking Pixel:**
- Email includes 1x1 transparent image
- Image URL: `/api/estimates/{id}/track`
- When loaded, status updates to "Viewed"

**Auto-Expiry:**
- Cron job runs daily at 2 AM
- Checks all "Sent" estimates where `created_at < NOW() - INTERVAL '7 days'`
- Updates status to "Expired"
- Sends notification to dispatcher

---

### **D. Invoice Lifecycle**

```
Draft
  → (Send to customer) → Sent
  → (Customer opens) → Viewed
  → (Payment received) → Paid
  OR
  → (Partial payment) → Partially Paid → (Balance paid) → Paid
  OR
  → (Past due date) → Overdue → (Eventually paid) → Paid

Alternate: Draft/Sent → Void (cancellation)
```

**Payment Status Logic:**
```typescript
if (invoice.paid_amount === 0) {
  status = 'Sent';
} else if (invoice.paid_amount < invoice.total) {
  status = 'Partially Paid';
} else if (invoice.paid_amount >= invoice.total) {
  status = 'Paid';
}

if (status !== 'Paid' && invoice.due_date < new Date()) {
  status = 'Overdue';
}
```

---

### **E. Service Request Lifecycle**

```
New
  → (Dispatcher reviews) → Triaged
  → (Estimate created) → Estimated
  → (Customer approves estimate) → Approved
  → (Converted to WO) → Converted to WO
  → (After WO closed) → Closed

Alternate:
  → (Spam/invalid) → Spam
  → (Duplicate) → Closed
```

**Auto-Closure:**
- When linked `WORK_ORDERS` status becomes "Closed"
- `SERVICE_REQUESTS` status auto-updates to "Closed"
- Triggered by database trigger or application logic

---

## **3. Recurring & Automated Workflows**

### **A. Recurring Work Orders** (Maintenance Contracts)

```
SERVICE_AGREEMENTS created:
├─ Type: Maintenance
├─ Recurrence: Monthly/Quarterly/Annually
├─ Linked ASSETS
└─ Auto-create WO enabled
    ↓
Cron job (daily at 2 AM):
├─ Check for due maintenance plans (ASSET_MAINTENANCE_PLANS)
├─ Auto-create WORK_ORDERS:
│   ├─ Copy service from template
│   ├─ Set priority based on SLA
│   └─ Status: "New"
└─ Notify dispatcher (daily summary email)
```

**Cron Schedule:** `0 2 * * *` (every day at 2 AM)

**SQL Query:**
```sql
SELECT * FROM asset_maintenance_plans
WHERE next_due_date <= CURRENT_DATE
  AND auto_create_wo = true
  AND is_deleted = false;
```

**Process:**
1. Query returns overdue maintenance plans
2. For each plan:
   - Create `WORK_ORDERS` record
   - Link to `asset_id` and `contact_id`
   - Set `priority` based on SLA urgency
   - Status: "New"
   - Update `next_due_date` based on frequency
3. Aggregate all new WOs into daily summary email
4. Send to dispatchers with role "dispatcher" or "admin"

---

### **B. SLA Monitoring & Alerts**

```
Cron job (hourly):
├─ Query all "In Progress" WOs with SERVICE_AGREEMENTS
├─ Calculate time since creation
├─ Check against SLA thresholds:
│   ├─ Response time (first contact)
│   └─ Resolution time (completion)
├─ If breach imminent:
│   ├─ Send alert to dispatcher (push + email)
│   ├─ Auto-escalate priority
│   └─ Log to AUDIT_LOGS
└─ SLA compliance dashboard updated
```

**Cron Schedule:** `0 * * * *` (every hour)

**SLA Calculation:**
```typescript
const responseDeadline = new Date(
  workOrder.created_at.getTime() +
  (sla.response_hours * 60 * 60 * 1000)
);

const resolutionDeadline = new Date(
  workOrder.created_at.getTime() +
  (sla.resolution_hours * 60 * 60 * 1000)
);

const now = new Date();
const timeRemaining = responseDeadline - now;

if (timeRemaining < 3600000 && timeRemaining > 0) {
  // Less than 1 hour remaining - send alert
  sendSlaAlert(workOrder, 'response_breach_imminent');
}
```

**Alert Channels:**
- Push notification to dispatcher mobile app
- Email to dispatcher and manager
- Dashboard widget shows "At Risk" count
- Work order priority auto-escalated: Medium → High → Critical

---

### **C. IoT Predictive Maintenance**

```
IoT sensors send telemetry to AI service:
├─ Temperature, vibration, runtime hours
├─ Stored in IOT_DATA table
└─ Real-time ingestion via WebSocket or REST
    ↓
AI LSTM model analyzes trends:
├─ Detects anomalies (Isolation Forest)
├─ Predicts failure probability
└─ Calculates equipment health score (0-100)
    ↓
If health score < 30:
├─ Auto-create SERVICE_REQUEST:
│   ├─ Category: "Preventive Maintenance"
│   ├─ Priority: "High"
│   └─ Description: AI-generated (LLM)
├─ Notify asset owner (email)
└─ Suggest parts to replace (based on historical data)
    ↓
Dispatcher converts to WO → Schedule maintenance → Prevent downtime
```

**IoT Data Ingestion:**
- **WebSocket:** `wss://api.example.com/iot/stream`
- **REST:** `POST /api/iot-data`

**Request Body:**
```json
{
  "asset_id": "uuid",
  "sensor_type": "temperature",
  "value": 85.2,
  "unit": "celsius",
  "timestamp": "2026-02-24T10:30:00Z"
}
```

**AI Processing:**
1. Data stored in `IOT_DATA` table
2. Celery task triggers AI analysis every 15 minutes
3. LSTM model predicts failure probability
4. Isolation Forest detects anomalies
5. Health score calculated: `100 - (failure_probability * 100)`

**Auto-Generated Service Request:**
```json
{
  "category": "Preventive Maintenance",
  "priority": "High",
  "subject": "HVAC Unit #1234 - Predicted Compressor Failure",
  "description": "AI analysis detected abnormal temperature fluctuations (85.2°C, 12% above normal). Predicted compressor failure within 7 days with 87% confidence. Recommended action: Replace compressor bearing assembly (Part #XYZ-789).",
  "asset_id": "uuid",
  "contact_id": "uuid",
  "location_id": "uuid"
}
```

---

### **D. Payment Reminder Workflow**

```
Cron job (daily at 9 AM):
├─ Query all "Sent" or "Viewed" invoices
├─ Filter by due_date:
│   ├─ Due in 3 days → Gentle reminder
│   ├─ Due in 1 day → Urgent reminder
│   └─ Past due → Overdue notice
├─ Send NOTIFICATIONS:
│   ├─ Email with payment link
│   ├─ SMS
│   └─ Push (if customer has app)
└─ Update invoice status to "Overdue" if past due
```

**Cron Schedule:** `0 9 * * *` (every day at 9 AM)

**SQL Query:**
```sql
SELECT * FROM invoices
WHERE status IN ('Sent', 'Viewed', 'Partially Paid')
  AND is_deleted = false
  AND (
    due_date = CURRENT_DATE + INTERVAL '3 days' OR
    due_date = CURRENT_DATE + INTERVAL '1 day' OR
    due_date < CURRENT_DATE
  );
```

**Reminder Templates:**
- **3 days before:** "Gentle reminder: Your invoice #INV-1234 for $250.00 is due in 3 days. Pay now: [link]"
- **1 day before:** "Urgent: Your invoice #INV-1234 for $250.00 is due tomorrow. Avoid late fees: [link]"
- **Past due:** "Overdue: Invoice #INV-1234 for $250.00 was due on 2026-02-21. A late fee of $25.00 has been added. Pay now: [link]"

**Late Fee Logic:**
```typescript
if (invoice.due_date < new Date() && invoice.status !== 'Paid') {
  const daysOverdue = Math.floor(
    (new Date() - invoice.due_date) / (1000 * 60 * 60 * 24)
  );

  const lateFee = tenant.settings.late_fee_percentage
    ? invoice.total * (tenant.settings.late_fee_percentage / 100)
    : tenant.settings.late_fee_flat || 0;

  invoice.total += lateFee;
  invoice.status = 'Overdue';
}
```

---

### **E. Review Solicitation Workflow**

```
Trigger: WORK_ORDERS status → "Completed"
    ↓
Wait 24 hours (background job)
    ↓
Send review request:
├─ SMS: "How was your service? Rate us: [Google link]"
├─ Email with star rating widget
└─ Customer Portal prompt
    ↓
If customer responds:
├─ Store in REVIEWS table
├─ If 1-2 stars → Alert manager for follow-up
├─ If 4-5 stars → Auto-post to website testimonials
└─ Update technician scorecard
```

**Trigger Implementation:**
- Database trigger on `WORK_ORDERS` table
- When status changes to "Completed", insert into `review_queue` table
- Background worker processes queue every minute

**Delay Mechanism:**
- BullMQ delayed job: `queue.add(data, { delay: 86400000 })` (24 hours)

**Review Links:**
- **Google:** `https://search.google.com/local/writereview?placeid={PLACE_ID}`
- **Yelp:** `https://www.yelp.com/writeareview/biz/{BUSINESS_ID}`
- **Internal:** `https://portal.example.com/reviews/new?wo={WO_ID}`

**Auto-Response Logic:**
```typescript
if (review.rating <= 2) {
  // Alert manager for damage control
  sendNotification({
    user_id: manager.id,
    type: 'low_rating_alert',
    title: 'Low Rating Received',
    body: `Customer ${contact.name} gave ${review.rating} stars for WO #${workOrder.number}`,
    priority: 'high'
  });

  // Create follow-up task
  createTask({
    title: 'Follow up on low rating',
    assigned_to: manager.id,
    due_date: new Date(Date.now() + 86400000), // 24 hours
    priority: 'critical'
  });
}

if (review.rating >= 4) {
  // Auto-publish to testimonials
  createTestimonial({
    customer_name: contact.name,
    rating: review.rating,
    comment: review.comment,
    service_type: workOrder.category,
    is_featured: review.rating === 5
  });
}
```

---

## **4. AI/ML Integration Workflows**

### **A. Smart Scheduling (OR-Tools VRP)**

```
Input:
├─ Unscheduled WORK_ORDERS (status: "Approved")
├─ Technician availability (USERS, SHIFTS, TIME_OFF)
├─ Skills required vs. agent skills (AGENT_SKILLS)
├─ Service LOCATIONS (lat/lng)
├─ Estimated durations (ML prediction from historical data)
└─ Territories (TERRITORIES table)
    ↓
AI Service (FastAPI):
POST /api/schedule/optimize
├─ Builds Vehicle Routing Problem (VRP):
│   ├─ Vehicles = technicians
│   ├─ Stops = job sites
│   ├─ Constraints: time windows, skills, territories
│   └─ Objective: minimize total travel time + balance workload
├─ OR-Tools solver runs (1-30 seconds depending on problem size)
└─ Returns optimal routes for each technician
    ↓
Output:
├─ Suggested SERVICE_APPOINTMENTS (tech + time slots)
├─ Dispatcher reviews on dispatch board
├─ One-click accept → Appointments created
└─ 30% average travel time reduction vs. manual scheduling
```

**API Request:**
```json
{
  "date": "2026-02-25",
  "work_order_ids": ["wo-uuid-1", "wo-uuid-2", "wo-uuid-3"],
  "technician_ids": ["tech-uuid-1", "tech-uuid-2"],
  "constraints": {
    "max_work_hours": 8,
    "lunch_break": true,
    "respect_territories": true,
    "skill_matching": true
  },
  "optimization_goal": "minimize_travel_time"
}
```

**API Response:**
```json
{
  "statusCode": 200,
  "status": "success",
  "message": "Schedule optimized successfully",
  "data": {
    "routes": [
      {
        "technician_id": "tech-uuid-1",
        "stops": [
          {
            "work_order_id": "wo-uuid-1",
            "arrival_time": "2026-02-25T09:00:00Z",
            "departure_time": "2026-02-25T10:30:00Z",
            "travel_time_from_previous": 15
          },
          {
            "work_order_id": "wo-uuid-3",
            "arrival_time": "2026-02-25T11:00:00Z",
            "departure_time": "2026-02-25T12:30:00Z",
            "travel_time_from_previous": 30
          }
        ],
        "total_travel_time": 45,
        "total_work_time": 180,
        "efficiency_score": 92
      }
    ],
    "metrics": {
      "total_travel_time_saved": 45,
      "workload_balance_score": 88,
      "skill_match_score": 100
    }
  }
}
```

**VRP Constraints:**
- **Time windows:** Work orders with customer-preferred times
- **Skills:** HVAC tech can't do electrical work
- **Territories:** North region tech shouldn't go to south region
- **Capacity:** Max 6 appointments per day per tech
- **Breaks:** Mandatory 30-min lunch break between 12-2 PM

**Dispatcher Workflow:**
1. Click "Auto-Schedule" button on Dispatch Board
2. Select date range and technicians
3. AI calculates optimal schedule in 5-10 seconds
4. Preview suggested appointments on Gantt chart
5. Drag-drop to adjust if needed
6. Click "Confirm Schedule" to create appointments

---

### **B. Document Intelligence (OCR + LLM)**

```
User uploads vendor invoice PDF/image:
    ↓
POST /api/documents/parse
├─ PaddleOCR extracts text
├─ LLM (GPT-4) structures data:
│   ├─ Vendor name
│   ├─ Invoice number
│   ├─ Date, due date
│   ├─ Line items (description, qty, price)
│   └─ Total amount
└─ Returns JSON
    ↓
DOCUMENTS table entry created
    ↓
Auto-populate invoice form in UI:
├─ User reviews extracted data
├─ Corrects errors (if any)
└─ Submit → INVOICES created
    ↓
Eliminates 90% manual data entry
```

**API Request:**
```bash
POST /api/documents/parse
Content-Type: multipart/form-data

file: invoice.pdf
document_type: vendor_invoice
```

**API Response:**
```json
{
  "statusCode": 200,
  "status": "success",
  "message": "Document parsed successfully",
  "data": {
    "vendor_name": "ACME Parts Supply",
    "invoice_number": "INV-98765",
    "invoice_date": "2026-02-20",
    "due_date": "2026-03-22",
    "line_items": [
      {
        "description": "HVAC Filter 16x20x1",
        "quantity": 10,
        "unit_price": 12.50,
        "total": 125.00
      },
      {
        "description": "Refrigerant R-410A (25lb)",
        "quantity": 2,
        "unit_price": 89.99,
        "total": 179.98
      }
    ],
    "subtotal": 304.98,
    "tax": 24.40,
    "total": 329.38,
    "confidence_score": 0.94
  }
}
```

**OCR Processing Steps:**
1. PDF uploaded to S3/GCS
2. Celery task triggered for processing
3. PaddleOCR extracts raw text and bounding boxes
4. LLM prompt:
   ```
   Extract invoice data from the following OCR text and return JSON:

   [OCR_TEXT]

   Required fields: vendor_name, invoice_number, invoice_date, due_date,
   line_items (array), subtotal, tax, total
   ```
5. Parse LLM JSON response
6. Store in `DOCUMENTS` table with confidence score
7. Return to user for review

**Confidence Handling:**
- Score > 0.9: Auto-populate form
- Score 0.7-0.9: Populate with warning banner
- Score < 0.7: Show extracted data as suggestions only

---

### **C. Chatbot (RAG + LLM)**

```
Customer visits Customer Portal
    ↓
Asks: "When will my HVAC repair be done?"
    ↓
POST /api/chat/message
├─ Chatbot engine (LangChain):
│   ├─ Retrieves context from Qdrant vector DB:
│   │   ├─ Customer's work orders
│   │   ├─ Knowledge base articles
│   │   └─ FAQs
│   ├─ Builds prompt with context
│   └─ LLM generates natural language response
└─ Returns: "Your HVAC repair is scheduled for tomorrow at 2 PM. Technician John will arrive between 2-4 PM."
    ↓
Customer satisfied → 40% reduction in support tickets
```

**API Request:**
```json
{
  "session_id": "chat-session-uuid",
  "message": "When will my HVAC repair be done?",
  "contact_id": "contact-uuid",
  "context": {
    "current_page": "customer_portal_dashboard"
  }
}
```

**RAG Process:**
1. Embed user query using OpenAI `text-embedding-ada-002`
2. Search Qdrant vector DB for similar content:
   - Customer's work orders (semantic search)
   - KB articles tagged "scheduling" or "HVAC"
   - Previous chat history in session
3. Retrieve top 5 most relevant chunks
4. Build LLM prompt:
   ```
   You are a helpful customer service assistant for FieldForce Pro.

   Context:
   - Customer: John Smith
   - Active Work Orders:
     - WO-1234: HVAC Repair, scheduled for 2026-02-25 at 2:00 PM, assigned to Technician John Davis

   Customer question: "When will my HVAC repair be done?"

   Provide a helpful, friendly response.
   ```
5. LLM generates response
6. Store chat message in `CHATBOT_SESSIONS` table

**API Response:**
```json
{
  "statusCode": 200,
  "status": "success",
  "message": "Message processed",
  "data": {
    "response": "Your HVAC repair is scheduled for tomorrow (February 25th) at 2:00 PM. Our technician John Davis will arrive between 2:00-4:00 PM. You'll receive a notification when he's on the way!",
    "confidence": 0.98,
    "sources": [
      {
        "type": "work_order",
        "id": "wo-1234",
        "title": "HVAC Repair - WO-1234"
      }
    ],
    "suggested_actions": [
      {
        "label": "View Work Order Details",
        "action": "navigate",
        "url": "/work-orders/wo-1234"
      },
      {
        "label": "Reschedule Appointment",
        "action": "navigate",
        "url": "/appointments/reschedule/apt-uuid"
      }
    ]
  }
}
```

**Supported Queries:**
- Scheduling: "When is my appointment?"
- Status: "What's the status of my work order?"
- Payment: "How much do I owe?"
- History: "Show me my past services"
- Booking: "I need to schedule a repair"

---

### **D. Sentiment Analysis (Service Requests)**

```
New SERVICE_REQUEST submitted via email:
Description: "Your technician showed up 3 hours late and didn't fix anything!!! I'm furious!!!"
    ↓
AI NLP model analyzes tone:
├─ Sentiment: Negative (-0.85)
├─ Emotion: Anger
└─ Urgency keywords: "furious", "didn't fix"
    ↓
Auto-escalate:
├─ Priority: Low → Critical
├─ Assign to senior dispatcher
├─ Notify manager (push notification)
└─ Add internal note: "Customer very upset - handle urgently"
    ↓
Dispatcher calls customer immediately → De-escalates → Prevents churn
```

**API Call:**
```typescript
POST /api/service-requests/categorize
{
  "description": "Your technician showed up 3 hours late and didn't fix anything!!! I'm furious!!!"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "status": "success",
  "data": {
    "sentiment": {
      "polarity": -0.85,
      "label": "negative",
      "emotion": "anger"
    },
    "suggested_priority": "critical",
    "suggested_category": "complaint",
    "urgency_keywords": ["furious", "3 hours late", "didn't fix"],
    "recommended_action": "immediate_callback"
  }
}
```

**Auto-Escalation Logic:**
```typescript
if (sentiment.polarity < -0.6 || sentiment.emotion === 'anger') {
  serviceRequest.priority = 'critical';
  serviceRequest.tags.push('angry_customer');

  // Assign to senior dispatcher
  const seniorDispatcher = await findSeniorDispatcher();
  serviceRequest.assigned_to = seniorDispatcher.id;

  // Create urgent task
  await createTask({
    title: `URGENT: Call angry customer - SR-${serviceRequest.number}`,
    assigned_to: seniorDispatcher.id,
    due_date: new Date(Date.now() + 1800000), // 30 minutes
    priority: 'critical'
  });

  // Notify manager
  await sendNotification({
    user_id: manager.id,
    type: 'angry_customer_alert',
    title: 'Angry Customer Detected',
    body: `Service Request SR-${serviceRequest.number} flagged as critical due to negative sentiment.`,
    priority: 'high'
  });
}
```

---

## **5. Multi-Tenancy Workflow**

All workflows are **tenant-scoped** to ensure data isolation:

```
User logs in:
├─ Email + password verified
├─ JWT token generated with payload:
│   ├─ user_id
│   ├─ tenant_id
│   ├─ roles (array)
│   └─ permissions (array)
└─ Token stored in client (localStorage/MMKV)
    ↓
Every API request:
├─ JWT verified (JwtAuthGuard)
├─ tenant_id extracted from JWT
├─ Injected into request context
└─ All database queries automatically scoped:
    WHERE tenant_id = {extracted_tenant_id} AND is_deleted = false
    ↓
Result: Complete data isolation between tenants (multi-org support)
```

**JWT Payload Structure:**
```json
{
  "sub": "user-uuid-1234",
  "email": "john@acmehvac.com",
  "tenant_id": "tenant-uuid-5678",
  "roles": ["technician", "user"],
  "permissions": [
    "work_orders:read",
    "work_orders:update",
    "appointments:read",
    "timesheets:create"
  ],
  "iat": 1708776000,
  "exp": 1708779600
}
```

**Tenant Middleware:**
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req['tenant_id'] = decoded.tenant_id;
      req['user_id'] = decoded.sub;
      req['permissions'] = decoded.permissions;
    }

    next();
  }
}
```

**Service Layer Auto-Scoping:**
```typescript
async findAll(pageOptions: PageOptionsDto, tenantId: string) {
  const { page, take, skip, order } = pageOptions;

  const { count, rows } = await this.workOrderRepository.findAndCountAll({
    where: {
      tenant_id: tenantId,  // ← Automatic tenant scoping
      is_deleted: false      // ← Soft delete filter
    },
    limit: take,
    offset: skip,
    order: [['created_at', order]]
  });

  return new PageDto(rows, new PageMetaDto({ page, take, itemCount: count }));
}
```

**Cross-Tenant Protection:**
- Even if a user guesses another tenant's work order UUID, the query returns null
- All foreign key relationships validated for same `tenant_id`
- File uploads stored in tenant-specific S3 prefixes: `s3://bucket/{tenant_id}/...`

---

## **6. Offline-First Mobile Workflow (WatermelonDB)**

```
Mobile app starts:
├─ Load data from local WatermelonDB:
│   ├─ Today's appointments
│   ├─ Work orders
│   ├─ Contacts
│   ├─ Service catalog
│   └─ Job sheet templates
└─ Check network status
    ↓
If online:
├─ Sync with server (incremental)
├─ Download new appointments
├─ Upload completed work (photos, signatures, timesheets)
└─ Resolve conflicts (last-write-wins or user prompt)
    ↓
If offline:
├─ All data available from local DB
├─ User can:
│   ├─ View schedule
│   ├─ Complete job sheets (photos saved locally)
│   ├─ Capture signatures
│   ├─ Clock in/out
│   └─ Add notes
├─ Changes queued for sync
└─ "Offline" indicator shown
    ↓
When network returns:
├─ Auto-sync queued changes
├─ Upload photos/signatures to S3/GCS
├─ Update server records
└─ Refresh local DB with server state
```

**WatermelonDB Schema:**
```typescript
// mobile/src/db/schema.ts
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'work_orders',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'number', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'contact_id', type: 'string' },
        { name: 'scheduled_start', type: 'number' },
        { name: 'scheduled_end', type: 'number' },
        { name: 'sync_status', type: 'string' }, // 'synced' | 'pending' | 'conflict'
        { name: 'updated_at', type: 'number' }
      ]
    }),
    tableSchema({
      name: 'appointments',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'work_order_id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'scheduled_start', type: 'number' },
        { name: 'actual_start', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' }
      ]
    }),
    tableSchema({
      name: 'job_sheet_items',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'instance_id', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'value', type: 'string', isOptional: true },
        { name: 'photo_uri', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' }
      ]
    })
  ]
});
```

**Sync Process:**

**1. Download Sync (Pull from Server):**
```typescript
async syncPull() {
  const lastSync = await AsyncStorage.getItem('last_sync_timestamp');

  const response = await api.get('/sync/pull', {
    params: {
      since: lastSync,
      entity_types: ['work_orders', 'appointments', 'contacts']
    }
  });

  const { work_orders, appointments, contacts } = response.data;

  await database.write(async () => {
    for (const wo of work_orders) {
      const existing = await workOrdersCollection.find(wo.id);

      if (existing) {
        await existing.update(record => {
          record.status = wo.status;
          record.scheduled_start = new Date(wo.scheduled_start).getTime();
          // ... update other fields
        });
      } else {
        await workOrdersCollection.create(record => {
          record._raw.id = wo.id;
          record.server_id = wo.id;
          record.status = wo.status;
          // ... set other fields
        });
      }
    }
  });

  await AsyncStorage.setItem('last_sync_timestamp', new Date().toISOString());
}
```

**2. Upload Sync (Push to Server):**
```typescript
async syncPush() {
  const pendingChanges = await database.collections
    .get('work_orders')
    .query(Q.where('sync_status', 'pending'))
    .fetch();

  for (const record of pendingChanges) {
    try {
      // Upload photos first
      if (record.photo_uri) {
        const photoUrl = await uploadPhoto(record.photo_uri);
        record.photo_url = photoUrl;
      }

      // Update server
      await api.put(`/work-orders/${record.server_id}`, {
        status: record.status,
        actual_start: new Date(record.actual_start),
        photo_url: record.photo_url
      });

      // Mark as synced
      await record.update(r => {
        r.sync_status = 'synced';
      });
    } catch (error) {
      console.error('Sync failed:', error);
      // Retry later
    }
  }
}
```

**3. Conflict Resolution:**
```typescript
async resolveConflicts() {
  const conflicts = await database.collections
    .get('work_orders')
    .query(Q.where('sync_status', 'conflict'))
    .fetch();

  for (const local of conflicts) {
    const remote = await api.get(`/work-orders/${local.server_id}`);

    if (local.updated_at > remote.updated_at) {
      // Local wins - push to server
      await api.put(`/work-orders/${local.server_id}`, local.toJSON());
    } else {
      // Remote wins - overwrite local
      await local.update(r => {
        Object.assign(r, remote);
        r.sync_status = 'synced';
      });
    }
  }
}
```

**Offline Capabilities:**
- ✅ View today's schedule
- ✅ Start/complete appointments
- ✅ Fill job sheets
- ✅ Capture photos (stored in device cache)
- ✅ Capture signatures
- ✅ Clock in/out (timesheet)
- ✅ Add work order notes
- ✅ View contact details
- ❌ Create new work orders (requires online)
- ❌ Accept payments (requires online)

---

## **7. Approval Workflow**

For features requiring multi-level approvals (estimates, timesheets, expenses):

```
User submits estimate for approval:
├─ WORKFLOW_TEMPLATES defines approval chain:
│   ├─ Step 1: Direct manager
│   ├─ Step 2: Finance (if > $5,000)
│   └─ Step 3: VP (if > $20,000)
└─ DOCUMENT_APPROVALS entry created
    ↓
Approver 1 notified:
├─ Email + push notification
├─ Opens approval modal
├─ Options: Approve / Reject / Delegate
└─ If approved:
    ↓
Next approver in chain notified
    ↓
If all approve:
├─ Estimate status: "Draft" → "Approved"
├─ Auto-convert to Work Order (if configured)
└─ Customer notified
    ↓
If any reject:
├─ Estimate status: "Draft" → "Rejected"
├─ Submitter notified with rejection reason
└─ Can revise and resubmit
```

**Workflow Template Structure:**
```json
{
  "id": "workflow-template-uuid",
  "tenant_id": "tenant-uuid",
  "name": "Estimate Approval Process",
  "entity_type": "estimate",
  "steps": [
    {
      "step_number": 1,
      "approver_role": "manager",
      "condition": "amount > 0",
      "can_delegate": true
    },
    {
      "step_number": 2,
      "approver_role": "finance_manager",
      "condition": "amount > 5000",
      "can_delegate": false
    },
    {
      "step_number": 3,
      "approver_role": "vp_operations",
      "condition": "amount > 20000",
      "can_delegate": false
    }
  ],
  "auto_approve_conditions": {
    "amount_less_than": 500,
    "submitter_has_role": "senior_technician"
  }
}
```

---

## **8. Webhook & Integration Workflow**

```
External event occurs (e.g., payment succeeded in Stripe):
    ↓
Stripe sends webhook POST to:
/api/payment-gateways/stripe/webhook
    ↓
Webhook verified (signature check)
    ↓
Parse event:
├─ event.type = "payment_intent.succeeded"
├─ Extract invoice_id from metadata
└─ Update PAYMENTS table:
    ├─ status: "pending" → "completed"
    ├─ gateway_transaction_id = payment_intent.id
    └─ paid_at = timestamp
    ↓
Update INVOICES:
├─ paid_amount += payment.amount
├─ If paid_amount >= total:
│   └─ status: "Sent" → "Paid"
└─ Else:
    └─ status: "Sent" → "Partially Paid"
    ↓
Send receipt to customer (email + SMS)
    ↓
AUDIT_LOGS entry created
    ↓
Webhook logs to monitoring (success/failure)
```

**Supported Webhook Events:**
- `work_order.created`
- `work_order.status_changed`
- `appointment.scheduled`
- `appointment.completed`
- `invoice.sent`
- `invoice.paid`
- `payment.received`
- `estimate.approved`
- `service_request.created`

---

## **9. Development Workflow (for Developers)**

Based on CLAUDE.md validation protocols:

### **Adding a New Feature (Example: "Customer Loyalty Points")**

```
1. Cross-reference IMPLEMENTATION_PLAN_V3.md
   ├─ Find spec (or write spec if new feature)
   └─ Identify affected modules

2. Server Implementation:
   ├─ Create LOYALTY_POINTS/ module:
   │   ├─ loyalty_points.entity.ts (Sequelize model)
   │   ├─ loyalty_points.provider.ts
   │   ├─ loyalty_points.service.ts (CRUD + business logic)
   │   ├─ loyalty_points.controller.ts (REST endpoints)
   │   ├─ loyalty_points.module.ts
   │   └─ dto/ (create, update, response DTOs)
   ├─ Register in app.module.ts
   ├─ Add Swagger decorators
   └─ Run Server API Validation checklist

3. Web Implementation:
   ├─ Create api/loyalty-points.api.ts (Axios calls)
   ├─ Create hooks/use-loyalty-points.ts (TanStack Query)
   ├─ Create pages/:
   │   ├─ LoyaltyPointsListPage.tsx (DataTable)
   │   ├─ LoyaltyPointsDetailPage.tsx
   │   └─ LoyaltyPointsFormPage.tsx (React Hook Form + Zod)
   ├─ Add routes to routes.tsx
   ├─ Add sidebar menu item
   └─ Run Web UI Validation checklist

4. Mobile Implementation (if needed):
   ├─ Create app/loyalty-points/index.tsx
   ├─ Add WatermelonDB model (if offline support needed)
   └─ Run Mobile UI Validation checklist

5. AI Implementation (if AI feature):
   ├─ Create model in ai/app/models/
   ├─ Add endpoint to ai/app/routers/
   └─ Run AI Service Validation checklist

6. Update ALL_TASKS.md:
   └─ Mark all sub-tasks [x] as completed

7. Git commit:
   ├─ Run validation tests
   ├─ Create commit with proper message
   └─ Push to feature branch

8. Cross-Platform Integration Validation:
   └─ End-to-end test (Postman + browser + mobile simulator)
```

**Validation Checklists:**

**Server API Validation:**
- [ ] Entity/model file exists with all required fields
- [ ] DTOs exist (create, update, response) with class-validator decorators
- [ ] Provider file follows Sequelize provider pattern
- [ ] Service implements: findAll (paginated, tenant-scoped), findById, create, update, soft-delete
- [ ] Controller has decorators: @UseGuards(JwtAuthGuard), @Permissions(), @TenantId()
- [ ] Module registered in app.module.ts
- [ ] All responses use DataResponseDto wrapper
- [ ] Pagination uses PageOptionsDto/PageMetaDto pattern
- [ ] Soft delete pattern: is_deleted boolean, all queries filter is_deleted: false
- [ ] Swagger decorators (@ApiTags, @ApiOperation, @ApiBearerAuth) on all endpoints
- [ ] Multi-tenancy: all queries scoped by tenant_id from JWT
- [ ] Endpoint tested (HTTP 200 for valid, 401/403 for unauthorized)

**Web UI Validation:**
- [ ] API file exists in web/src/api/
- [ ] TanStack Query hook exists in web/src/hooks/
- [ ] List page uses DataTable component with pagination, search, filters
- [ ] Detail page shows all entity fields
- [ ] Form page uses React Hook Form + Zod validation
- [ ] Page registered in routes.tsx with auth guard
- [ ] Sidebar navigation entry added
- [ ] Responsive layout works (desktop and tablet)
- [ ] Loading, empty, and error states handled
- [ ] Permission-based rendering
- [ ] Forms submit correctly with success/error notifications
- [ ] List refreshes after create/update/delete (TanStack Query invalidation)

---

## **10. Key Workflow Principles**

### **1. Multi-Tenancy**
- Every workflow scoped by `tenant_id` from JWT
- Complete data isolation between tenants
- Tenant-specific file storage (S3 prefixes)

### **2. Soft Delete**
- No hard deletes → all queries filter `is_deleted: false`
- Audit trail preserved forever
- "Delete" button sets `is_deleted: true` and `deleted_at: timestamp`

### **3. State Machines (Blueprint Engine)**
- Status transitions enforced with guards
- Role-based transition permissions
- Required fields validated before transition
- Webhooks triggered on state change

### **4. AI-First**
- ML models integrated at every decision point:
  - Scheduling (OR-Tools VRP)
  - Routing (traffic-aware)
  - Pricing (conversion optimization)
  - Maintenance (predictive LSTM)
  - Categorization (NLP)
  - Document parsing (OCR + LLM)

### **5. Offline-First (Mobile)**
- WatermelonDB for local persistence
- All core features work without network
- Auto-sync when connection returns
- Conflict resolution (last-write-wins)

### **6. Audit Trail**
- All CUD operations logged to `AUDIT_LOGS`
- Immutable log entries
- Who, what, when, where tracking
- Compliance-ready (SOC 2, GDPR, HIPAA)

### **7. Real-Time Updates**
- WebSocket events for:
  - Live agent location tracking
  - Appointment status changes
  - New notifications
  - Dashboard metrics
  - Chat messages

### **8. Automation**
- Cron jobs for:
  - Recurring work orders
  - SLA monitoring
  - Payment reminders
  - Review solicitation
  - Estimate expiry
  - IoT analysis

### **9. Validation**
- Every feature passes validation checklists before completion
- Server, Web, Mobile, AI, Cross-Platform, Feature Completeness
- Ensures quality and consistency

### **10. Consistent Patterns**
- All modules follow same structure:
  - Entity → Provider → Service → Controller → Module
- Naming conventions enforced
- TypeScript strict typing (no `any`)
- Error handling standardized

---

## **Appendix: Visual Workflow Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FIELDFORCE PRO WORKFLOW                         │
└─────────────────────────────────────────────────────────────────────┘

Customer Request → Triage → Estimate → Approval → Work Order → Schedule
                     ↓         ↓          ↓           ↓           ↓
                   AI NLP    AI Pricing  Digital   Blueprint   AI VRP
                            Suggestion   Signature   Engine    Optimizer
                                                                   ↓
                                                            Appointment
                                                                   ↓
                                                     Mobile App (Offline)
                                                                   ↓
                                    ┌──────────────────────────────────┐
                                    │  Trip → On-Site → Job Sheet     │
                                    │  Photos → Signature → Complete   │
                                    └──────────────────────────────────┘
                                                                   ↓
                                                        Service Report (AI)
                                                                   ↓
                                                              Invoice
                                                                   ↓
                                    ┌──────────────────────────────────┐
                                    │  Payment (Online/On-site)       │
                                    │  Stripe/Razorpay Webhook        │
                                    └──────────────────────────────────┘
                                                                   ↓
                                                           Review Request
                                                                   ↓
                                                         Analytics Dashboard
                                                                   ↓
                                                          AI Model Retrain

═══════════════════════════════════════════════════════════════════════

Parallel Workflows:
├─ Recurring Maintenance (Auto-WO Creation)
├─ SLA Monitoring (Hourly Alerts)
├─ IoT Predictive Maintenance (Real-time Analysis)
├─ Payment Reminders (Daily Cron)
└─ Webhook Integrations (Event-driven)
```

---

**End of Project Flow Documentation**

*This document is the authoritative guide for understanding all workflows in FieldForce Pro. For implementation details, refer to IMPLEMENTATION_PLAN_V3.md. For task tracking, see ALL_TASKS.md. For project instructions, see CLAUDE.md.*
