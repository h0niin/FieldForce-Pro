# WF-MNT-equipment-health-dashboard — Equipment Health Dashboard (Predictive Maintenance)

## Module
Predictive Maintenance — `EquipmentHealthDashboardPage` (`/maintenance/health-dashboard`)

## Prerequisites
- User must be authenticated (route is nested under the authenticated app layout).
- Note: the page currently renders from built-in demo data; it does not call a backend API or load tenant data.

---

## Steps — View the Health Dashboard Overview

1. Navigate to `/maintenance/health-dashboard`. The page header shows a dashboard icon and the title **Equipment Health Dashboard**.
2. In the top-right of the header, a **Refresh** button (reload icon) is displayed.
3. Below the header, four summary statistic cards are shown:

   | Card | Meaning |
   |---|---|
   | **Total** | Total number of equipment records |
   | **Healthy** | Count of equipment at `low` risk (green) |
   | **Needs Attention** | Count of equipment at `medium` or `high` risk (orange) |
   | **Critical** | Count of equipment at `critical` risk (red) |

4. To the right of the filter bar, an **Avg Health** tag shows the average health score as a percentage. The tag color is green when average ≥ 70%, orange when ≥ 50%, otherwise red. Hovering it shows a tooltip.

---

## Steps — Read the Equipment Health Table

1. The equipment table lists each unit with the following columns:

   | Column | Description |
   |---|---|
   | **Equipment** | Equipment name (bold) with its category shown underneath |
   | **Health Score** | A progress bar (0–100). Green ≥ 80, yellow ≥ 60, red ≥ 40, dark red below 40. Sortable. |
   | **Risk Level** | A colored tag with icon: **LOW** (green, check), **MEDIUM** (orange, exclamation circle), **HIGH** (red, warning), **CRITICAL** (magenta, close circle) |
   | **Failure Probability** | Probability as a percent (one decimal). Shown in red when > 70%, warning color when > 30%. Sortable. |
   | **Last Maintenance** | Date of the last maintenance |
   | **Predicted Failure** | Predicted failure date in red, or **N/A** when there is no prediction |
   | **Actions** | **View Details** and **Run Prediction** link buttons |

2. The table is paginated at 10 rows per page.
3. Click the **Health Score** or **Failure Probability** column headers to sort by that metric.

---

## Steps — Search and Filter Equipment

1. Use the **search** input (magnifying-glass icon) above the table to filter by equipment name. Filtering is case-insensitive and updates as you type. Use the clear control to reset it.
2. Use the **Risk Level** dropdown to filter by a single risk level: **Low**, **Medium**, **High**, or **Critical**. Clear the selection to show all risk levels.
3. Search text and risk-level filter combine — both conditions must match for a row to appear.

---

## Steps — Per-Equipment Actions

1. In the **Actions** column of any row, click **View Details** to inspect that equipment, or **Run Prediction** to trigger a maintenance prediction for it.
2. Use the header **Refresh** button to reload the dashboard.

---

## Actions Summary

| Action | Button/Control | Permission | API |
|---|---|---|---|
| View dashboard | Open `/maintenance/health-dashboard` | Authenticated | None (renders demo data) |
| Refresh dashboard | **Refresh** button (header) | Authenticated | None (no handler wired) |
| Search equipment | Search input | Authenticated | Client-side filter on demo data |
| Filter by risk | **Risk Level** dropdown | Authenticated | Client-side filter on demo data |
| Sort by metric | **Health Score** / **Failure Probability** column headers | Authenticated | Client-side sort |
| View equipment details | **View Details** link button (row) | Authenticated | None (no handler wired) |
| Run prediction | **Run Prediction** link button (row) | Authenticated | None (no handler wired) |
