# WF-AGR-sla-compliance-dashboard — SLA Compliance Dashboard

## Module
Agreements — `SLAComplianceDashboard` (`/agreements/sla-compliance`)

## Prerequisites
- User must be authenticated (PrivateRoute guard).
- Service agreements should exist; the dashboard derives SLA metrics from agreements fetched via `useServiceAgreements`.

---

## Steps — View the SLA Compliance Dashboard

1. Navigate to `/agreements/sla-compliance`. The page loads the **SLA Compliance Dashboard** (title and subtitle rendered by the `PageHeader`).
2. The dashboard fetches up to 100 service agreements via the `useServiceAgreements({ page: 1, take: 100 })` hook and computes SLA metrics for each one.
3. A filter bar (Card at top) shows two **Select** controls and a **Refresh** button.
4. Four summary statistic cards are displayed in a row:

   | Statistic Card | Prefix Icon | Meaning |
   |---|---|---|
   | **Avg Response Compliance** | TrophyOutlined | Average response-time compliance across all agreements, shown as a percent (turns green at >= 95%, otherwise amber) |
   | **Avg Resolution Compliance** | CheckCircleOutlined | Average resolution-time compliance across all agreements, percent (green at >= 95%, otherwise amber) |
   | **At Risk Agreements** | WarningOutlined | Count of agreements in `warning` + `critical` status (amber if > 0, else green) |
   | **Total Breaches** | CloseCircleOutlined | Sum of breaches across all agreements (red if > 0, else green) |

5. If any agreement is in **critical** status, a red alert banner appears above the table showing the critical count.

---

## Steps — Filter and Sort the Compliance Table

1. The main **table** lists one row per agreement with these columns:
   - **Agreement** — the `agreement_number`, rendered as a link.
   - **Status** — a colored Tag: `EXCELLENT` (green), `GOOD` (blue), `WARNING` (amber), `CRITICAL` (red). Column has built-in filters for each status.
   - **Response Time Compliance** — a Progress bar plus percent value (color thresholds: >= 95% green, >= 85% blue, >= 75% amber, below red). Sortable.
   - **Resolution Time Compliance** — same Progress bar / percent / color thresholds. Sortable.
   - **Total Requests** — numeric count. Sortable.
   - **Breaches** — a Tag colored green (0), orange (< 5), or red (>= 5). Sortable.
2. Use the **Time Range** Select (top-left of the filter bar) to choose a period: **7d**, **30d** (default), **90d**, or **1y**.
3. Use the **Status** Select (with placeholder "all statuses", clearable) to filter rows to a single status: `excellent`, `good`, `warning`, or `critical`. Selecting a value filters the table client-side to matching rows.
4. Click a column header (Response Time Compliance, Resolution Time Compliance, Total Requests, or Breaches) to sort by that metric.
5. The table paginates at 10 rows per page with a size changer and a total count display.
6. If no agreements match the current filter, an **Empty** state (no data) is shown; while loading, a "loading" message is displayed.

---

## Steps — Drill Into an Agreement

1. In the compliance table, click an agreement name in the **Agreement** column.
2. The app navigates to `/agreements/{agreementId}` for that service agreement's detail view.

---

## Steps — Refresh the Data

1. Click the **Refresh** button (ReloadOutlined icon) on the right of the filter bar.
2. This calls `refetch()` on the `useServiceAgreements` query, re-fetching the agreements list and recomputing all SLA metrics.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| View dashboard | Navigate to `/agreements/sla-compliance` | Authenticated | `useServiceAgreements({ page: 1, take: 100 })` |
| Change time range | **Time Range** Select (7d / 30d / 90d / 1y) | Authenticated | Client-side state (`timeRange`) |
| Filter by status | **Status** Select (excellent / good / warning / critical) | Authenticated | Client-side filter on computed metrics |
| Sort metrics | Click sortable column header | Authenticated | Client-side table sorter |
| Open agreement detail | Agreement name link in table | Authenticated | Navigates to `/agreements/:agreementId` |
| Refresh | **Refresh** button (ReloadOutlined) | Authenticated | `refetch()` on `useServiceAgreements` |
