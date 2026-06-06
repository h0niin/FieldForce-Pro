# WF-RPT-view-reports — View Reports Dashboard & Drill Into Report Detail

## Module
Reports — `ReportListPage` (`/reports`), `ReportDetailPage` (`/reports/:reportId`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).

---

## Steps — View Reports Overview

1. In the left sidebar under **Analytics**, click **Reports**. The browser navigates to `/reports`.
2. The page title reads **"Reports"** with subtitle "View comprehensive business analytics and reports".
3. A **date range picker** is displayed in the top-right with presets:
   - **Last 7 Days**, **Last 30 Days** (default), **Last 90 Days**, **This Year**
4. Five report cards are displayed in a 2-column grid:

   | Card Title | Description | Key Stats |
   |---|---|---|
   | **Work Orders** | Track work order status, priority distribution, and completion metrics | Total, Completed, In Progress, Avg Completion |
   | **Service Requests** | Monitor incoming requests, triage status, and conversion rates | Total Requests, New, Converted to WO, Conversion Rate |
   | **Invoices & Revenue** | Analyze revenue, invoice amounts, and payment collection rates | Total Invoices, Revenue, Avg Amount, Collection Rate |
   | **Payments** | Review payment volumes, methods, and success rates | Total Payments, Collected, Completed, Success Rate |
   | **Performance** | Evaluate technician efficiency, fix rates, and response times | First-Time Fix, Avg Response, Avg Resolution, Top Performers |

5. Click any card to navigate to `/reports/{card.key}` (e.g., `/reports/work-orders`).

---

## Steps — View Report Detail Page

1. From the reports overview, click a report card. The detail page loads at `/reports/:reportId`.
2. A back arrow button (ArrowLeftOutlined) returns to `/reports`.
3. A **Segmented** navigation bar allows switching between report types: **Work Orders**, **Service Requests**, **Invoices**, **Payments**, **Performance**.
4. A filter bar contains:
   - **Date range picker** with same presets as overview.
   - **CSV** export button (DownloadOutlined) — exports the current report data as CSV.
   - **Excel** export button (FileExcelOutlined) — exports as Excel.
5. Below the filter bar, charts and statistics render based on the active report type.

---

## Steps — Export Report Data

1. Navigate to a report detail page (e.g., `/reports/work-orders`).
2. Set the desired date range using the **date range picker**.
3. Click the **CSV** button to download CSV, or the **Excel** button for Excel.
4. A success notification appears: "Report exported as CSV" or "Report exported as EXCEL".

---

## Actions Summary

| Action | Button | Permission | API |
|---|---|---|---|
| View reports overview | Click sidebar **Reports** | Authenticated | `useWorkOrderReport`, `useInvoiceReport`, `usePerformanceReport`, `useServiceRequestReport`, `usePaymentReport` |
| Drill into report | Click report card | Authenticated | Same hooks, conditional on `reportId` |
| Export CSV | **CSV** button | Authenticated | `exportToCSV()` client-side |
| Export Excel | **Excel** button | Authenticated | `exportToExcel()` client-side |
| Change date range | Date range picker | Authenticated | Re-fetches with new `start_date`/`end_date` |
| Switch report type | Segmented tabs | Authenticated | Re-fetches corresponding hook |
