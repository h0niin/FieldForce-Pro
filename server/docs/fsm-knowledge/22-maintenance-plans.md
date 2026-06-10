# Maintenance Plans

## What is a Maintenance Plan?
A maintenance plan is a scheduled, recurring service programme for a customer's asset. It ensures preventive maintenance happens on a regular schedule automatically, so equipment is kept in good condition and warranty requirements are met.

**Examples:**
- HVAC system: quarterly filter change + annual full service
- Fire suppression system: 6-monthly inspection + annual testing
- Generator: monthly run test + annual oil change and service

---

## Accessing Maintenance Plans

Click **Maintenance Plans** in the sidebar (or **Assets → Maintenance Plans**).

---

## What a Maintenance Plan Contains

| Field | Description |
|-------|-------------|
| **Plan Name** | Descriptive name (e.g., "Quarterly HVAC Filter Change") |
| **Asset** | The equipment this plan is for |
| **Frequency** | How often the service happens (weekly, fortnightly, monthly, quarterly, bi-annually, annually, or custom interval in days) |
| **Next Due Date** | The next scheduled service date |
| **Auto Create Work Order** | When ON: a work order is created automatically when the due date arrives |
| **Work Order Template** | Pre-fills the work order's summary, description, priority, and job sheet template |
| **Assigned Technician** | Default technician assigned to auto-created work orders |
| **Customer / Contact** | The customer this plan belongs to |
| **Notes** | Internal notes about the maintenance schedule |

---

## Creating a Maintenance Plan

### From the Maintenance Plans List
1. Go to **Maintenance Plans** in the sidebar.
2. Click **+ New Maintenance Plan**.
3. Fill in the **Plan Name**, **Asset**, **Frequency**, and **Next Due Date**.
4. Toggle **Auto Create Work Order** to ON if you want work orders created automatically.
5. Set the **Assigned Technician** and any other template fields.
6. Click **Save**.

### From an Asset's Detail Page
1. Open the asset.
2. Click the **Maintenance Plans** tab.
3. Click **+ Add Maintenance Plan**.
4. Fill in the plan details (the Asset field is pre-filled).
5. Click **Save**.

---

## How Auto Work Order Creation Works

When **Auto Create Work Order** is enabled:
1. Each day, the system checks all maintenance plans for plans whose **Next Due Date** is today.
2. For matching plans, a new work order is automatically created with the linked template details.
3. The **Next Due Date** is then updated to the next occurrence based on the frequency.
4. The auto-created work order appears in the **Work Orders** list with a special "Recurring" tag.
5. The assigned technician receives a notification.

---

## Viewing the Maintenance Schedule

Go to **Maintenance Plans** and use the calendar view (if available) to see all upcoming maintenance dates across all assets and customers.

Filter the list by:
- **Customer** — see all plans for one customer
- **Asset** — see all plans for one asset
- **Frequency** — show only monthly plans, etc.
- **Next Due Date** — see what's coming up this week or month

---

## Editing a Maintenance Plan
1. Open the maintenance plan.
2. Click **Edit**.
3. Update the fields.
4. Click **Save**.

**Note:** Changing the frequency or next due date does not affect work orders already created from this plan.

---

## Deleting a Maintenance Plan
1. Open the maintenance plan.
2. Click **Delete** and confirm.
3. Future auto work order creation stops. Past work orders are preserved.

---

## Equipment Health Dashboard

The **Equipment Health Dashboard** (go to **Maintenance → Equipment Health**) shows:
- All assets with their current **Health Score** (0–100)
- Assets **overdue** for maintenance (past their Next Due Date)
- Assets with **upcoming** maintenance in the next 7 days / 30 days
- Assets with **expiring warranties** in the next 90 days
- AI-generated predictions for assets at risk of failure

Use this dashboard to proactively plan service visits before assets break down.

---

## Maintenance Plan vs. Service Agreement vs. Work Order

| | Maintenance Plan | Service Agreement | Work Order |
|--|-----------------|------------------|------------|
| **What it is** | Recurring service schedule | Commercial contract with SLA terms | A single job |
| **Repeating?** | Yes (auto-generates WOs) | Yes (defines the commitment) | No (one-off) |
| **Linked to asset?** | Yes | Optional | Optional |
| **SLA tracking?** | No | Yes | Yes (via SLA policy) |
