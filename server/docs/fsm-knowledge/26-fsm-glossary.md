# FSM Glossary — Every Term Explained

This glossary defines every term used in FieldForce Pro and in the field service management industry. Use it to understand what any term means.

---

## A

**Agent**
Another word for a technician or field worker. The person who physically goes to a customer's location to perform work.

**Agreement (Service Agreement)**
A contract between your company and a customer that defines the scope and terms of ongoing service. See the Service Agreements section for details.

**Asset**
A piece of equipment or machinery that belongs to a customer and that your company services or maintains. Examples: HVAC unit, generator, elevator, fire panel.

**Asset Health Score**
A number from 0 to 100 that indicates how well-maintained and operational an asset is. Calculated by the AI based on age, service history, and fault patterns. Higher is better.

**Appointment (Service Appointment)**
A scheduled visit by a technician to a customer's location. An appointment has a start time, end time, technician, and is linked to a work order. One work order can have multiple appointments.

**Audit Log**
An immutable record of every action taken in the system — who changed what, when. Used for compliance, dispute resolution, and security monitoring.

---

## B

**Billable**
Describes time or costs that will be charged to the customer. On a timesheet, marking work as "billable" means the hours will appear on the invoice.

**Blueprint**
A visual workflow designer that lets you create custom status flows for work orders, estimates, or invoices. Instead of fixed statuses, you define your own steps and transition rules.

**Bulk Action**
An action applied to multiple records at once. For example, selecting 10 work orders and changing them all to "Scheduled" in one click.

---

## C

**Catalog**
The library of services and parts your company offers. The Services Catalog lists service offerings; the Parts Catalog lists stocked components. Line items on estimates and invoices are pulled from the catalog.

**Channel**
How a service request or communication arrived. Common channels: Web Form, Phone Call, Email, Walk-In, WhatsApp.

**Clock In / Clock Out**
The action of a technician recording when they started and stopped working on a job. Used to generate timesheets.

**Company**
A business organisation that is a customer. Multiple individual Contacts can be linked to one Company.

**Contact**
An individual customer person. Contains their name, email, phone, and service history.

**Convert (to Work Order)**
The action of turning an approved Estimate or Service Request into a Work Order.

**Crew**
A group of technicians who work together as a unit on jobs. A crew has a designated lead and can be assigned to work orders as a team.

**Custom Field**
An extra data field added by an administrator to a module (e.g., adding a "Customer Reference Number" field to work orders). Lets you capture data specific to your business.

---

## D

**Dispatch**
The act of assigning and sending a technician to a job. When you dispatch a technician, they receive a notification and their appointment status changes to "Dispatched."

**Dispatch Board**
The Gantt chart view in the Scheduling module. Shows all technicians as rows with their scheduled appointments as blocks across a timeline. The main tool for scheduling and dispatching.

**Draft**
A status for records (estimates, invoices, job sheets) that have been created but not yet sent or submitted. Drafts can be freely edited.

---

## E

**ETA (Estimated Time of Arrival)**
The predicted time a technician will arrive at the job site. Shown to customers on the tracking portal.

**Estimate**
A pricing quote sent to a customer before work begins. The customer can approve or reject it. An approved estimate can be converted to a work order.

---

## F

**Field Technician / Field Worker**
A person from your team who travels to customer locations to perform work. Also called an "agent" in FieldForce Pro.

**Field Service Management (FSM)**
The category of software that manages the operations of companies that send workers to customer sites to perform services. FieldForce Pro is an FSM platform.

**First Response Time**
The maximum time allowed to make first contact with the customer after a job is received. Part of an SLA policy.

---

## G

**Gantt Chart (Dispatch Board)**
A horizontal bar chart where each row is a technician and each bar is an appointment. Used for visual scheduling. Appointments can be dragged and dropped to reschedule.

**GPS Tracking**
Real-time location tracking of technicians via the mobile app. Used for the live map, trip history, and customer tracking portal.

---

## H

**Hard Delete**
Permanently removing a record from the database. FieldForce Pro uses Soft Delete only — records are hidden but never permanently removed.

**Health Score**
See Asset Health Score.

**Holiday**
A company-defined day when no work is normally scheduled. Appears as a blocked-out day on the Dispatch Board.

---

## I

**Invoice**
A bill sent to a customer after work is completed. It itemises all labour, parts, and materials and requests payment. Invoices go through the flow: Draft → Sent → Viewed → Paid.

**Invoice Aging**
How long an invoice has been outstanding (unpaid) past its due date. Grouped into 30/60/90+ day buckets in the aging report.

---

## J

**Job Sheet**
A digital checklist a technician fills out on site. Replaces paper service reports. Can include checkboxes, text fields, photo requirements, and signature capture.

**Job Site**
The physical location where work is performed. Corresponds to a Service Location in FieldForce Pro.

---

## K

**KPI (Key Performance Indicator)**
A measurable value that shows how well your business is performing. Examples: technician utilisation rate, SLA compliance rate, first-time fix rate, revenue per job.

---

## L

**Line Item**
A single charge on an estimate or invoice — can be a service, a part, travel cost, or other cost. Each line item has a description, quantity, unit price, and total.

**Live Map**
The real-time map view showing all technicians' current GPS positions and job site locations.

**Magic Link**
A one-time login link sent to a user's email. Clicking it logs them in without needing a password. Used for the customer portal and for inviting new team members.

---

## M

**Maintenance Plan**
A recurring schedule for servicing an asset. Automatically creates work orders at the set frequency (monthly, quarterly, etc.).

**Mobile App**
The iOS/Android app that technicians use in the field. It works offline, supports GPS tracking, photo capture, job sheets, digital signatures, and clock-in/out.

**Module**
A section of FieldForce Pro dedicated to a specific function. Examples: Work Orders module, Invoices module, Scheduling module.

**Multi-Tenancy**
The system architecture that keeps each company's data completely separate. Your data is only visible to users within your organisation.

---

## N

**NL Analytics (Natural Language Analytics)**
A feature that lets you ask questions about your data in plain English (e.g., "How many jobs were completed last month?") and receive a chart or table as the answer.

**Note**
An internal comment attached to a work order, service request, contact, or other record. Notes are not visible to customers.

---

## O

**OCR (Optical Character Recognition)**
AI technology that reads text from photos or scanned documents. Used in the AI Vision feature to extract data from uploaded invoices and documents.

**Offline Mode**
The mobile app's ability to function without internet connectivity. Data is stored locally and synced when connectivity is restored.

**On Hold**
A status for work orders and appointments that are temporarily paused — waiting for parts, awaiting customer decision, etc. The SLA clock may pause during On Hold status.

---

## P

**Parts Catalog**
See Catalog. The inventory of physical components your company stocks and uses on jobs.

**Payment Gateway**
A third-party payment processor (Stripe, Square, PayPal) integrated with FieldForce Pro to allow customers to pay invoices online.

**Permission**
A specific action a user role is allowed to perform. Written as `module:action` (e.g., `work_orders:create`, `invoices:read`). Permissions are assigned to roles, roles are assigned to users.

**Pricebook**
A tiered pricing structure (Good/Better/Best) for services. Lets you present customers with multiple pricing options on a single estimate.

**Priority**
The urgency level of a work order, service request, or estimate: Low, Medium, High, or Urgent. Affects SLA timers and dispatch order.

**Push Notification**
An alert sent directly to the mobile app. Used to notify technicians of new job assignments, schedule changes, and messages from dispatchers.

---

## R

**Recurring Work Order**
A work order that repeats on a set schedule (generated by a Maintenance Plan or a Workflow Rule with recurrence).

**Resolution Time**
The maximum time allowed to fully complete a job after it is received. Part of an SLA policy.

**Role**
A named set of permissions. Default roles: Admin, Dispatcher, Technician, Manager. Custom roles can be created with any combination of permissions.

**Route Polyline**
The line drawn on a map showing the path a technician actually drove. Stored as part of a Trip record.

---

## S

**Schedule**
The planned timeline of appointments for technicians. Managed via the Dispatch Board (Gantt chart), Calendar View, or Map View.

**Service Agreement**
See Agreement.

**Service Appointment**
See Appointment.

**Service Catalog**
See Catalog.

**Service Location**
A physical address where work is performed. Linked to a Contact or Company. Stores GPS coordinates for routing and mapping.

**Service Report**
A document generated after job completion that summarises what was done, parts used, photos taken, and any signatures. Can be sent to the customer or downloaded as a PDF.

**Service Request**
An incoming request from a customer asking for help, before it is turned into a work order. Goes through an approval process (New → Triaged → Approved → Converted to Work Order).

**Shift**
Defined working hours for a team or technician. Used by the scheduling system to know when each technician is available.

**SKU (Stock Keeping Unit)**
A unique code identifying a part in your Parts Catalog. Used for inventory tracking.

**SLA (Service Level Agreement)**
A commitment to respond to and resolve jobs within a defined timeframe, based on priority. Tracked automatically by the platform.

**Soft Delete**
Hiding a record (marking it as deleted) instead of permanently removing it. The data is preserved for audit purposes but doesn't appear in normal lists.

**Status**
The current stage of a record in its workflow. Examples for a Work Order: New, Scheduled, In Progress, Completed.

**Status Transition**
Moving a record from one status to the next. Transitions follow a defined path and cannot be skipped (e.g., a work order cannot jump from New to Completed without going through Scheduled, In Progress, etc.).

---

## T

**Tenant**
A single organisation using FieldForce Pro. Each tenant has completely isolated data.

**Territory**
A geographical zone defined on a map. Used to assign jobs to the right technician based on location.

**Timesheet**
A record of hours worked by a technician on a specific job, including travel time, work time, and break time.

**Trip**
An automatically recorded journey by a technician from point A to point B. Stored with GPS coordinates, timestamps, distance, and route.

---

## U

**Utilisation Rate**
The percentage of a technician's available working time that is spent actively on paid jobs. A key KPI.

---

## W

**Webhook**
An automatic notification sent from FieldForce Pro to an external system (URL) when a specific event occurs (e.g., "Send a POST request to our ERP when a work order is completed"). Used for integrations.

**Work Order**
The central record for a field service job. Contains all job details, status, line items, notes, attachments, appointments, and invoices. Everything in FieldForce Pro connects back to the work order.

**Workflow Rule**
An automated rule that performs an action when a trigger condition is met (e.g., "When a work order is completed, automatically create a draft invoice"). Configured in Settings.

---

## Z

**Zone**
See Territory.
