# WF-DASH-navigate-dashboard — Navigate Dashboard & KPI Widgets

## Prerequisites:
- User is authenticated (JWT token valid).
- User has access to at least one of: invoices, payments, work orders, estimates, dashboard stats (permissions checked by backend; widgets still render but show loading/0 values if data is absent).
- Dashboard is available at route `/dashboard`.

---

## Overview

The Dashboard page (`/dashboard`) presents two rows of KPI cards (Financial and Operations), a Revenue & Collections area chart, a Work Order Pipeline pie chart, an Invoice Overview card, and an Estimate Pipeline card. Every KPI card is clickable and navigates to the relevant module list page.

---

## WF-DASH-1 — View the Dashboard

1. In the sidebar under "Main Navigation", click **Dashboard** (DashboardOutlined icon, key `/dashboard`).
2. The page loads with the heading **Dashboard** and a greeting line: e.g. "Good Morning, [first_name] · Monday, May 30".
3. Wait for all KPI cards to resolve (spinner `<Spin size="small" />` disappears inside each card value).

---

## WF-DASH-2 — Navigate to Invoices via "Total Revenue" KPI Card

Prerequisites: Financial KPI row is visible (always rendered).

1. Follow WF-DASH-1.
2. Locate the first KPI card labelled **Total Revenue** (green FundOutlined icon). Sub-text shows "From N paid invoices".
3. Click the card (entire card is `hoverable`, `onClick={() => navigate('/invoices')}`).
4. Browser navigates to `/invoices`.

---

## WF-DASH-3 — Navigate to Invoices via "Payments Collected" KPI Card

Prerequisites: Financial KPI row is visible.

1. Follow WF-DASH-1.
2. Locate the second KPI card labelled **Payments Collected** (blue CreditCardOutlined icon). Sub-text shows "N completed payments".
3. Click the card (`onClick={() => navigate('/invoices')}`).
4. Browser navigates to `/invoices`.

---

## WF-DASH-4 — Navigate to Invoices via "Outstanding" KPI Card

Prerequisites: Financial KPI row is visible.

1. Follow WF-DASH-1.
2. Locate the third KPI card labelled **Outstanding** (orange WalletOutlined icon). Sub-text shows "N unpaid invoice(s)".
3. Click the card (`onClick={() => navigate('/invoices')}`).
4. Browser navigates to `/invoices`.

---

## WF-DASH-5 — Navigate to Invoices via "Overdue" KPI Card

Prerequisites: Financial KPI row is visible. Card border turns red and background is `rgba(255,77,79,0.1)` when `overdueAmount > 0`.

1. Follow WF-DASH-1.
2. Locate the fourth KPI card labelled **Overdue** (red AlertOutlined icon). Sub-text shows "N overdue invoice(s)".
3. Click the card (`onClick={() => navigate('/invoices')}`).
4. Browser navigates to `/invoices`.

---

## WF-DASH-6 — Navigate to Work Orders via "Active Jobs" KPI Card

Prerequisites: Operations KPI row is visible.

1. Follow WF-DASH-1.
2. Locate the fifth KPI card labelled **Active Jobs** (blue ToolOutlined icon). Sub-text shows "of N total work orders".
3. Click the card (`onClick={() => navigate('/work-orders')}`).
4. Browser navigates to `/work-orders`.

---

## WF-DASH-7 — Navigate to Work Orders via "Completion Rate" KPI Card

Prerequisites: Operations KPI row is visible.

1. Follow WF-DASH-1.
2. Locate the sixth KPI card labelled **Completion Rate** (green CheckCircleOutlined icon). A progress bar below the percentage reflects `opsStats.completionRate`.
3. Click the card (`onClick={() => navigate('/work-orders')}`).
4. Browser navigates to `/work-orders`.

---

## WF-DASH-8 — Navigate to Scheduling via "Today's Appointments" KPI Card

Prerequisites: Operations KPI row is visible.

1. Follow WF-DASH-1.
2. Locate the seventh KPI card labelled **Today's Appointments** (blue ScheduleOutlined icon). Sub-text shows "N total scheduled".
3. Click the card (`onClick={() => navigate('/scheduling')}`).
4. Browser navigates to `/scheduling`.

---

## WF-DASH-9 — Navigate to Service Requests via "Pending Requests" KPI Card

Prerequisites: Operations KPI row is visible.

1. Follow WF-DASH-1.
2. Locate the eighth KPI card labelled **Pending Requests** (purple ExclamationCircleOutlined icon).
3. Click the card (`onClick={() => navigate('/service-requests?status=new')}`).
4. Browser navigates to `/service-requests?status=new` (pre-filtered to status = new).

---

## WF-DASH-10 — Navigate to Work Orders via "Work Order Pipeline" Card Header Link

Prerequisites: "Work Order Pipeline" card is visible in the charts row; `woStatusData` is non-empty (at least one work order exists).

1. Follow WF-DASH-1.
2. Locate the card titled **Work Order Pipeline** (right side of the charts row).
3. Click the **View All** link button in the card's `extra` slot (ArrowRight icon follows the text).
4. `onClick={() => navigate('/work-orders')}` fires.
5. Browser navigates to `/work-orders`.

---

## WF-DASH-11 — Navigate to Invoices via "Invoice Overview" Card Header Link

Prerequisites: "Invoice Overview" card is visible; `invoices.length > 0` (otherwise "No invoices" Empty state is shown instead of status bars).

1. Follow WF-DASH-1.
2. Locate the card titled **Invoice Overview** (left side of the invoice/estimate row).
3. Click the **View All** link button in the card's `extra` slot.
4. `onClick={() => navigate('/invoices')}` fires.
5. Browser navigates to `/invoices`.

---

## WF-DASH-12 — Read the Revenue & Collections Chart

Prerequisites: Invoices data has loaded (`invLoading === false`).

1. Follow WF-DASH-1.
2. Locate the card titled **Revenue & Collections** with subtitle "Last 6 months".
3. Hover over any data point on the area chart to see a tooltip with dollar-formatted values.
4. Legend at the bottom shows two series: **Invoiced** (green line) and **Collected** (blue line).
5. No user action; chart is read-only.

---

## WF-DASH-13 — Read the Invoice Overview Status Bars

Prerequisites: `invoices.length > 0`; `invLoading === false`.

1. Follow WF-DASH-1.
2. Locate the **Invoice Overview** card, section labelled "By Status".
3. Each row shows: a colored dot, the status label (e.g. "Paid", "Overdue"), count and dollar total, and a progress bar proportional to `count / invoices.length`.
4. No interactive actions; display only.

---

## WF-DASH-14 — Read the Estimate Pipeline Summary

Prerequisites: `estimates.length > 0`; `estLoading === false`.

1. Follow WF-DASH-1.
2. Locate the **Estimate Pipeline** card.
3. Three stat boxes show: **Win Rate** (%), **Total** (count), **Pipeline** (dollar value of draft/sent/viewed estimates).
4. Status tags below (e.g. "Draft: 2", "Sent: 1") are rendered for each status present in `estimatePipeline.counts`.
5. No interactive actions; display only.
